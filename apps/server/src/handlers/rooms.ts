import { RoomService, formatRoom } from '../services/RoomService'
import { LiveKitService } from '../services/LiveKitService'
import { ModerationService } from '../services/ModerationService'
import { parseRepeatableQuery } from '../lib/query'
import { normalizeCountryCode } from '@streamyolo/shared/iso-countries'

const roomService = new RoomService()
const liveKitService = new LiveKitService()
const moderationService = new ModerationService()

export async function getRoomTaxonomy(_request: unknown, reply: { send: (body: unknown) => unknown }) {
  const taxonomy = await roomService.getTaxonomy()
  return reply.send({ data: taxonomy })
}

export async function listRooms(request: { query?: Record<string, string | string[] | undefined> }, reply: { send: (body: unknown) => unknown }) {
  const { cursor, limit, q, category, country, tag } = request.query ?? {}
  const result = await roomService.list({
    cursor: typeof cursor === 'string' ? cursor : undefined,
    limit: typeof limit === 'string' ? Number(limit) : undefined,
    q: typeof q === 'string' ? q : undefined,
    categories: parseRepeatableQuery(category),
    countryCodes: parseRepeatableQuery(country).map(normalizeCountryCode),
    tagSlugs: parseRepeatableQuery(tag),
  })
  return reply.send({ data: result.rooms, meta: result.meta })
}

export async function listCreatorRooms(request: { user: { id: string }; query?: { cursor?: string; limit?: string } }, reply: { send: (body: unknown) => unknown }) {
  const { cursor, limit } = request.query ?? {}
  const result = await roomService.listByCreatorUserId(request.user.id, {
    cursor,
    limit: limit ? Number(limit) : undefined,
  })
  return reply.send({ data: result.rooms, meta: result.meta })
}

export async function getRoom(request: { params: { roomId: string } }, reply: { send: (body: unknown) => unknown }) {
  const room = await roomService.getById(request.params.roomId)
  return reply.send({ data: { room: formatRoom(room), vipUserIds: [] } })
}



export async function prepareRoom(request: { user: { id: string }; body: Record<string, unknown> }, reply: { status: (code: number) => { send: (body: unknown) => unknown } }) {
  const room = await roomService.prepare(request.user.id, request.body as Parameters<RoomService['prepare']>[1])
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

export async function updateCreatorRoom(request: { user: { id: string }; params: { roomId: string }; body: Record<string, unknown> }, reply: { send: (body: unknown) => unknown }) {
  const room = await roomService.update(request.user.id, request.params.roomId, request.body as any)
  return reply.send({ data: { room: formatRoom(room) } })
}

export async function goLive(request: { user: { id: string }; params: { roomId: string }; server: { io?: { to: (room: string) => { emit: (event: string, payload: unknown) => void } } } }, reply: { send: (body: unknown) => unknown }) {
  const room = await roomService.goLive(request.user.id, request.params.roomId)

  try {
    await liveKitService.createRoom(room.livekitRoomName)
  } catch {
    // room may already exist on LiveKit side
  }

  const { token: livekitToken, livekitUrl } = await liveKitService.getToken(request.user.id, {
    appRoomType: 'PUBLIC_ROOM',
    appRoomId: room.id,
  })

  const io = request.server.io
  if (io) {
    io.to(`room:${room.id}`).emit('room:started', { roomId: room.id })
  }

  return reply.send({ data: { room: formatRoom(room), livekitToken, livekitUrl } })
}

export async function endRoom(request: { user: { id: string }; params: { roomId: string }; server: { io?: { to: (room: string) => { emit: (event: string, payload: unknown) => void } } } }, reply: { send: (body: unknown) => unknown }) {
  const room = await roomService.endRoom(request.user.id, request.params.roomId)
  const io = request.server.io
  if (io) {
    io.to(`room:${room.id}`).emit('room:ended', { roomId: room.id })
  }
  return reply.send({ data: { room: formatRoom(room) } })
}
