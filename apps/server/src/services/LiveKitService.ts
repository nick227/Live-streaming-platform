import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'
import { db } from '@streamyolo/db'

const LK_URL = process.env.LIVEKIT_URL ?? ''
const LK_KEY = process.env.LIVEKIT_API_KEY ?? ''
const LK_SECRET = process.env.LIVEKIT_API_SECRET ?? ''

if (!LK_URL || !LK_KEY || !LK_SECRET) {
  throw new Error('Missing required env vars: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET')
}

export class LiveKitService {
  private roomService = new RoomServiceClient(LK_URL, LK_KEY, LK_SECRET)

  async getToken(
    userId: string,
    input: { appRoomType: 'PUBLIC_ROOM' | 'PRIVATE_SESSION'; appRoomId: string },
  ) {
    let livekitRoomName: string
    let canPublish: boolean

    if (input.appRoomType === 'PUBLIC_ROOM') {
      const room = await db.room.findUnique({
        where: { id: input.appRoomId },
        include: { creator: true },
      })
      if (!room) throw { statusCode: 404, message: 'Room not found' }
      livekitRoomName = room.livekitRoomName
      canPublish = room.creator.userId === userId
    } else {
      const session = await db.privateSession.findUnique({ where: { id: input.appRoomId } })
      if (!session) throw { statusCode: 404, message: 'Private session not found' }
      if (session.viewerId !== userId) {
        const creator = await db.creatorProfile.findUnique({ where: { id: session.creatorId } })
        if (creator?.userId !== userId) throw { statusCode: 403, message: 'Forbidden' }
      }
      if (!session.livekitRoomName) throw { statusCode: 400, message: 'Session not started' }
      livekitRoomName = session.livekitRoomName
      canPublish = true
    }

    const at = new AccessToken(LK_KEY, LK_SECRET, {
      identity: userId,
      ttl: 3600,
    })
    at.addGrant({
      roomJoin: true,
      room: livekitRoomName,
      canPublish,
      canSubscribe: true,
    })

    return {
      livekitUrl: LK_URL,
      token: await at.toJwt(),
      roomName: livekitRoomName,
    }
  }

  async createRoom(roomName: string) {
    await this.roomService.createRoom({ name: roomName })
  }

  async deleteRoom(roomName: string) {
    try {
      await this.roomService.deleteRoom(roomName)
    } catch {
      // room may already be gone
    }
  }
}
