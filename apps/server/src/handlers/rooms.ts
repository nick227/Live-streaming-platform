import { RoomService, formatRoom } from '../services/RoomService'

const roomService = new RoomService()

export async function listRooms(request: any, reply: any) {
  const { cursor, limit, q } = request.query ?? {}
  const result = await roomService.list({ cursor, limit, q })
  return reply.send({ data: result.rooms, meta: result.meta })
}

export async function listCreatorRooms(request: any, reply: any) {
  const { cursor, limit } = request.query ?? {}
  const result = await roomService.listByCreatorUserId(request.user.id, { cursor, limit })
  return reply.send({ data: result.rooms, meta: result.meta })
}

export async function getRoom(request: any, reply: any) {
  const room = await roomService.getByIdOrSlug(request.params.slug)
  const formattedRoom = formatRoom(room)
  return reply.send({
    data: {
      room: formattedRoom,
      viewerState: {
        canChat: true,
        canTip: true,
        canRequestPrivate: formattedRoom.privateAvailable,
        hasActivePrivateSession: false,
      },
    },
  })
}

export async function prepareRoom(request: any, reply: any) {
  const room = await roomService.prepare(request.user.id, request.body)
  const goLiveEligibility = await roomService.getGoLiveEligibility(request.user.id, room.id)
  return reply.status(200).send({
    data: {
      room: formatRoom(room),
      goLiveEligibility: {
        canGoLive: goLiveEligibility.missing.length === 0,
        missing: goLiveEligibility.missing,
      },
    },
  })
}

import { AccessToken } from 'livekit-server-sdk'

export async function goLive(request: any, reply: any) {
  const room = await roomService.goLive(request.user.id, request.params.roomId)
  // Emit Socket.IO event if available
  const io = (request.server as any).io
  if (io) {
    io.to(`room:${room.id}`).emit('room:viewer_count', { roomId: room.id, viewerCount: room.viewerCount })
  }

  const apiKey = process.env.LIVEKIT_API_KEY ?? 'dev-api-key'
  const apiSecret = process.env.LIVEKIT_API_SECRET ?? 'dev-api-secret'
  
  const token = new AccessToken(apiKey, apiSecret, {
    identity: request.user.id,
    name: room.creator?.user?.displayName ?? request.user.displayName ?? request.user.id,
  })
  
  token.addGrant({
    roomJoin: true,
    room: room.livekitRoomName,
    canPublish: true,
    canSubscribe: true,
  })

  const livekitToken = await token.toJwt()
  const livekitUrl = process.env.LIVEKIT_URL ?? 'wss://dev.livekit.cloud'

  return reply.send({ data: { room: formatRoom(room), livekitToken, livekitUrl } })
}

export async function endRoom(request: any, reply: any) {
  const room = await roomService.endRoom(request.user.id, request.params.roomId)
  const io = (request.server as any).io
  if (io) {
    io.to(`room:${room.id}`).emit('room:ended', { roomId: room.id })
  }
  return reply.send({ data: { room: formatRoom(room) } })
}
