import { RoomService, formatRoom } from '../services/RoomService'

const roomService = new RoomService()

export async function listRooms(request: any, reply: any) {
  const { cursor, limit, q } = request.query ?? {}
  const result = await roomService.list({ cursor, limit, q })
  return reply.send({ data: result.rooms, meta: result.meta })
}

export async function getRoom(request: any, reply: any) {
  const room = await roomService.getByIdOrSlug(request.params.roomId)
  return reply.send({ data: formatRoom(room) })
}

export async function prepareRoom(request: any, reply: any) {
  const room = await roomService.prepare(request.user.id, request.body)
  return reply.status(201).send({ data: formatRoom(room) })
}

export async function goLive(request: any, reply: any) {
  const room = await roomService.goLive(request.user.id, request.params.roomId)
  // Emit Socket.IO event if available
  const io = (request.server as any).io
  if (io) {
    io.to(`room:${room.id}`).emit('room:viewer_count', { roomId: room.id, viewerCount: room.viewerCount })
  }
  return reply.send({ data: { room: formatRoom(room) } })
}

export async function endRoom(request: any, reply: any) {
  const room = await roomService.endRoom(request.user.id, request.params.roomId)
  const io = (request.server as any).io
  if (io) {
    io.to(`room:${room.id}`).emit('room:ended', { roomId: room.id })
  }
  return reply.send({ data: { room: formatRoom(room) } })
}
