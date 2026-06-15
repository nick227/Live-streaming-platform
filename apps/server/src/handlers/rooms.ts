import { RoomService, formatRoom } from '../services/RoomService'
import { LiveKitService } from '../services/LiveKitService'

const roomService = new RoomService()
const liveKitService = new LiveKitService()

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

export async function goLive(request: any, reply: any) {
  const room = await roomService.goLive(request.user.id, request.params.roomId)

  // Ensure the LiveKit room exists before issuing a token (idempotent if already created)
  try {
    await liveKitService.createRoom(room.livekitRoomName)
  } catch {
    // room may already exist on LiveKit side
  }

  const { token: livekitToken, livekitUrl } = await liveKitService.getToken(request.user.id, {
    appRoomType: 'PUBLIC_ROOM',
    appRoomId: room.id,
  })

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
