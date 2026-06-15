import { db } from '@streamyolo/db'
import { nanoid } from 'nanoid'
import { encodeCursor, decodeCursor, normalizeLimit } from '../lib/pagination'

export class RoomService {
  async listByCreatorUserId(
    creatorUserId: string,
    params: { cursor?: string; limit?: number },
  ) {
    const creator = await db.creatorProfile.findUnique({ where: { userId: creatorUserId } })
    if (!creator) return { rooms: [], meta: { hasMore: false, nextCursor: null } }

    const limit = normalizeLimit(params.limit)
    const cursorPayload = decodeCursor(params.cursor)

    const rooms = await db.room.findMany({
      where: {
        creatorId: creator.id,
        ...(cursorPayload
          ? {
              OR: [
                { createdAt: { lt: new Date(cursorPayload.createdAt) } },
                { createdAt: new Date(cursorPayload.createdAt), id: { lt: cursorPayload.id } },
              ],
            }
          : {}),
      },
      include: { creator: CREATOR_INCLUDE, goal: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    })

    const hasMore = rooms.length > limit
    if (hasMore) rooms.pop()

    const nextCursor = hasMore
      ? encodeCursor({ createdAt: rooms[rooms.length - 1].createdAt.toISOString(), id: rooms[rooms.length - 1].id })
      : null

    return { rooms: rooms.map(formatRoom), meta: { hasMore, nextCursor } }
  }

  async list(params: { cursor?: string; limit?: number; q?: string; status?: string }) {
    const limit = normalizeLimit(params.limit)
    const cursorPayload = decodeCursor(params.cursor)

    const rooms = await db.room.findMany({
      where: {
        status: (params.status as any) ?? 'LIVE',
        visibility: 'PUBLIC',
        ...(params.q ? { title: { contains: params.q } } : {}),
        ...(cursorPayload
          ? {
              OR: [
                { createdAt: { lt: new Date(cursorPayload.createdAt) } },
                { createdAt: new Date(cursorPayload.createdAt), id: { lt: cursorPayload.id } },
              ],
            }
          : {}),
      },
      include: {
        creator: CREATOR_INCLUDE,
        goal: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    })

    const hasMore = rooms.length > limit
    if (hasMore) rooms.pop()

    const nextCursor = hasMore
      ? encodeCursor({ createdAt: rooms[rooms.length - 1].createdAt.toISOString(), id: rooms[rooms.length - 1].id })
      : null

    return { rooms: rooms.map(formatRoom), meta: { hasMore, nextCursor } }
  }

  async getByIdOrSlug(idOrSlug: string) {
    const room = await db.room.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        creator: CREATOR_INCLUDE,
        goal: true,
        menuItems: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!room) throw { statusCode: 404, message: 'Room not found' }
    return room
  }

  async prepare(
    creatorUserId: string,
    data: { title: string; slug?: string; visibility?: string; thumbnailMediaId?: string; coverMediaId?: string },
  ) {
    let creator = await db.creatorProfile.findUnique({ where: { userId: creatorUserId } })
    if (!creator) {
      const user = await db.user.findUnique({ where: { id: creatorUserId } })
      if (!user) throw { statusCode: 404, message: 'User not found' }
      creator = await db.creatorProfile.create({
        data: {
          userId: creatorUserId,
          status: 'PENDING',
        }
      })
      await db.user.update({ where: { id: creatorUserId }, data: { role: 'CREATOR' } })
    }

    const slug = data.slug ?? `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${nanoid(6)}`
    const livekitRoomName = `room-${nanoid(16)}`

    const room = await db.room.create({
      data: {
        creatorId: creator.id,
        title: data.title,
        slug,
        livekitRoomName,
        visibility: (data.visibility as any) ?? 'PUBLIC',
        thumbnailMediaId: data.thumbnailMediaId,
        coverMediaId: data.coverMediaId,
      },
      include: {
        creator: CREATOR_INCLUDE,
        goal: true,
      },
    })
    return room
  }

  async goLive(creatorUserId: string, roomId: string) {
    const room = await this._assertCreatorOwnsRoom(creatorUserId, roomId)
    const missing = await this._goLiveEligibility(room)
    if (missing.length > 0) throw { statusCode: 422, message: `Missing: ${missing.join(', ')}` }

    const updated = await db.room.update({
      where: { id: roomId },
      data: { status: 'LIVE', startedAt: new Date() },
      include: { creator: CREATOR_INCLUDE, goal: true },
    })

    await db.creatorProfile.update({
      where: { id: room.creatorId },
      data: { isLive: true, currentRoomId: roomId },
    })

    return updated
  }

  async endRoom(creatorUserId: string, roomId: string) {
    const room = await this._assertCreatorOwnsRoom(creatorUserId, roomId)

    const updated = await db.room.update({
      where: { id: roomId },
      data: { status: 'ENDED', endedAt: new Date() },
      include: { creator: CREATOR_INCLUDE, goal: true },
    })

    await db.creatorProfile.update({
      where: { id: room.creatorId },
      data: { isLive: false, currentRoomId: null },
    })

    return updated
  }

  async getGoLiveEligibility(creatorUserId: string, roomId: string) {
    const room = await this._assertCreatorOwnsRoom(creatorUserId, roomId)
    const missing = await this._goLiveEligibility(room)
    return { missing }
  }

  private async _goLiveEligibility(room: any) {
    const missing: string[] = []
    const creator = await db.creatorProfile.findUnique({ where: { id: room.creatorId } })
    if (!creator) return ['CREATOR_NOT_APPROVED']

    if (creator.status !== 'ACTIVE') missing.push('CREATOR_NOT_APPROVED')
    if (!room.thumbnailMediaId) missing.push('ROOM_THUMBNAIL')
    if (!room.title?.trim()) missing.push('ROOM_TITLE')
    if (!creator.privateRulesText?.trim()) missing.push('PRIVATE_RULES_TEXT')
    if (!creator.privateRateTokensPerMinute || creator.privateRateTokensPerMinute <= 0) missing.push('PRIVATE_RATE')

    const menuCount = await db.creatorMenuItem.count({
      where: { creatorId: creator.id, isActive: true },
    })
    if (menuCount === 0) missing.push('TIP_MENU')

    return missing
  }

  private async _assertCreatorOwnsRoom(creatorUserId: string, roomId: string) {
    const creator = await db.creatorProfile.findUnique({ where: { userId: creatorUserId } })
    if (!creator) throw { statusCode: 403, message: 'Creator profile required' }

    const room = await db.room.findUnique({ where: { id: roomId } })
    if (!room) throw { statusCode: 404, message: 'Room not found' }
    if (room.creatorId !== creator.id) throw { statusCode: 403, message: 'Forbidden' }

    return room
  }
}

export const CREATOR_INCLUDE = {
  select: {
    id: true,
    userId: true,
    isLive: true,
    status: true,
    privateRateTokensPerMinute: true,
    minPrivateMinutes: true,
    privateViewerCamRequired: true,
    privateScreenShareAllowed: true,
    user: { select: { displayName: true } },
  },
}

export function formatRoom(room: any) {
  return {
    id: room.id,
    slug: room.slug,
    title: room.title,
    status: room.status,
    visibility: room.visibility,
    thumbnailUrl: room.thumbnailMediaId ? `/media/${room.thumbnailMediaId}` : null, // just mock or omit since string is ok
    viewerCount: room.viewerCount,
    privateAvailable: room.creator?.privateRateTokensPerMinute > 0,
    privateRateTokensPerMinute: room.creator?.privateRateTokensPerMinute ?? null,
    minPrivateMinutes: room.creator?.minPrivateMinutes ?? 1,
    privateViewerCamRequired: room.creator?.privateViewerCamRequired ?? false,
    privateScreenShareAllowed: room.creator?.privateScreenShareAllowed ?? false,
    startedAt: room.startedAt?.toISOString() ?? null,
    createdAt: room.createdAt.toISOString(),
    creator: room.creator
      ? {
          id: room.creator.id,
          userId: room.creator.userId,
          displayName: room.creator.user?.displayName ?? 'Creator',
          isLive: room.creator.isLive,
          status: room.creator.status,
        }
      : undefined,
    goal: room.goal
      ? {
          id: room.goal.id,
          title: room.goal.title,
          targetTokens: room.goal.targetTokens,
          currentTokens: room.goal.currentTokens,
        }
      : undefined,
  }
}
