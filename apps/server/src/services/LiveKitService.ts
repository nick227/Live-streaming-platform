import { httpError } from '../lib/errors'
import '../lib/env'
import { AccessToken, RoomServiceClient, TrackSource, type VideoGrant } from 'livekit-server-sdk'
import { db } from '@streamyolo/db'

const LK_URL = process.env.LIVEKIT_URL ?? ''
const LK_KEY = process.env.LIVEKIT_API_KEY ?? ''
const LK_SECRET = process.env.LIVEKIT_API_SECRET ?? ''

if (!LK_URL || !LK_KEY || !LK_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing required env vars: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET')
  }
  console.warn('[LiveKitService] LiveKit env vars not set — video features will fail at runtime')
}

export class LiveKitService {
  private roomService?: RoomServiceClient

  private assertConfigured() {
    if (!LK_URL || !LK_KEY || !LK_SECRET) {
      throw {
        statusCode: 503,
        message: 'LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.',
      }
    }
  }

  private getRoomService() {
    this.assertConfigured()
    this.roomService ??= new RoomServiceClient(LK_URL, LK_KEY, LK_SECRET)
    return this.roomService
  }

  async getToken(
    userId: string,
    input: { appRoomType: 'PUBLIC_ROOM' | 'PRIVATE_SESSION'; appRoomId: string },
  ) {
    this.assertConfigured()

    let livekitRoomName: string
    let canPublish: boolean
    let canPublishSources: VideoGrant['canPublishSources'] | undefined

    if (input.appRoomType === 'PUBLIC_ROOM') {
      const room = await db.room.findUnique({
        where: { id: input.appRoomId },
        include: { creator: true },
      })
      if (!room) throw httpError(404, 'Room not found')
      if (room.creator.userId !== userId) {
        const ban = await db.creatorUserBan.findFirst({
          where: {
            creatorId: room.creatorId,
            userId,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        })
        if (ban) throw httpError(403, 'You are banned from this creator')
      }
      livekitRoomName = room.livekitRoomName
      canPublish = room.creator.userId === userId
      canPublishSources = canPublish
        ? room.mediaMode === 'AUDIO_ONLY'
          ? [TrackSource.MICROPHONE]
          : [
              TrackSource.CAMERA,
              TrackSource.MICROPHONE,
              TrackSource.SCREEN_SHARE,
              TrackSource.SCREEN_SHARE_AUDIO,
            ]
        : undefined
    } else {
      const session = await db.privateSession.findUnique({
        where: { id: input.appRoomId },
        include: { creator: true },
      })
      if (!session) throw httpError(404, 'Private session not found')
      const isViewer = session.viewerId === userId
      const isCreator = session.creator.userId === userId
      if (!isViewer && !isCreator) throw httpError(403, 'Forbidden')
      if (!session.livekitRoomName) throw httpError(400, 'Session not started')
      livekitRoomName = session.livekitRoomName
      canPublish = true
      canPublishSources = [TrackSource.MICROPHONE]
      if (isCreator || session.viewerCamMode === 'OPTIONAL' || session.viewerCamMode === 'REQUIRED') {
        canPublishSources.push(TrackSource.CAMERA)
      }
      if (isCreator && session.screenShareAllowed) {
        canPublishSources.push(TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO)
      }
    }

    const at = new AccessToken(LK_KEY, LK_SECRET, {
      identity: userId,
      ttl: 3600,
    })
    at.addGrant({
      roomJoin: true,
      room: livekitRoomName,
      canPublish,
      ...(canPublishSources ? { canPublishSources } : {}),
      canSubscribe: true,
    })

    return {
      livekitUrl: LK_URL,
      token: await at.toJwt(),
      roomName: livekitRoomName,
    }
  }

  async createRoom(roomName: string) {
    await this.getRoomService().createRoom({ name: roomName })
  }

  async deleteRoom(roomName: string) {
    try {
      await this.getRoomService().deleteRoom(roomName)
    } catch {
      // room may already be gone
    }
  }

  async getRoomParticipants(roomName: string) {
    try {
      return await this.getRoomService().listParticipants(roomName)
    } catch {
      return []
    }
  }
}
