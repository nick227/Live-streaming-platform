import type { RoomCategory } from '@streamyolo/shared/room-taxonomy'
import {
  categoryEnumToSlug,
  isRoomCategory,
  MAX_ROOM_TAGS,
  ROOM_CATEGORIES,
  ROOM_CATEGORY_LABELS,
} from '@streamyolo/shared/room-taxonomy'
import {
  getCountryName,
  ISO_COUNTRIES,
  isValidCountryCode,
  normalizeCountryCode,
  POPULAR_COUNTRY_CODES,
} from '@streamyolo/shared/iso-countries'
import { httpError } from '../lib/errors'
import { db } from '@streamyolo/db'
import { nanoid } from 'nanoid'
import { encodeCursor, decodeCursor, normalizeLimit } from '../lib/pagination'
import { LiveKitService } from './LiveKitService'
import { PrivateSessionService } from './PrivateSessionService'

const liveKitService = new LiveKitService()
const privateSessionService = new PrivateSessionService()

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

const ROOM_INCLUDES = {
  creator: CREATOR_INCLUDE,
  goal: true,
  tags: { include: { tag: true } },
} as const

export type PrepareRoomData = {
  title: string
  slug?: string
  visibility?: string
  thumbnailMediaId?: string
  coverMediaId?: string
  category?: string
  countryCode?: string
  tagSlugs?: string[]
  saveAsDefaults?: boolean
}

export class RoomService {
  async getTaxonomy() {
    const tags = await db.roomTag.findMany({
      where: { isActive: true },
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }],
    })

    return {
      categories: ROOM_CATEGORIES.map((value) => ({
        value,
        label: ROOM_CATEGORY_LABELS[value],
        slug: categoryEnumToSlug(value),
      })),
      tags: tags.map((tag) => ({
        slug: tag.slug,
        label: tag.label,
        group: tag.group,
      })),
      countries: ISO_COUNTRIES.map((country) => ({
        code: country.code,
        name: country.name,
      })),
      popularCountryCodes: [...POPULAR_COUNTRY_CODES],
    }
  }

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
      include: ROOM_INCLUDES,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    })

    return this._paginateRooms(rooms, limit)
  }

  async list(params: {
    cursor?: string
    limit?: number
    q?: string
    status?: string
    categories?: string[]
    countryCodes?: string[]
    tagSlugs?: string[]
  }) {
    const limit = normalizeLimit(params.limit)
    const cursorPayload = decodeCursor(params.cursor)
    const categories = params.categories?.filter(isRoomCategory) ?? []

    const rooms = await db.room.findMany({
      where: {
        status: (params.status as 'LIVE' | 'ENDED' | undefined) ?? 'LIVE',
        visibility: 'PUBLIC',
        ...(params.q ? { title: { contains: params.q } } : {}),
        ...(categories.length ? { category: { in: categories as RoomCategory[] } } : {}),
        ...(params.countryCodes?.length
          ? { countryCode: { in: params.countryCodes.map(normalizeCountryCode) } }
          : {}),
        ...(params.tagSlugs?.length
          ? {
              tags: {
                some: {
                  tag: { slug: { in: params.tagSlugs }, isActive: true },
                },
              },
            }
          : {}),
        ...(cursorPayload
          ? {
              OR: [
                { createdAt: { lt: new Date(cursorPayload.createdAt) } },
                { createdAt: new Date(cursorPayload.createdAt), id: { lt: cursorPayload.id } },
              ],
            }
          : {}),
      },
      include: ROOM_INCLUDES,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    })

    return this._paginateRooms(rooms, limit)
  }

  async getByIdOrSlug(idOrSlug: string) {
    const room = await db.room.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        ...ROOM_INCLUDES,
        menuItems: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!room) throw httpError(404, 'Room not found')
    return room
  }

  async prepare(creatorUserId: string, data: PrepareRoomData) {
    let creator = await db.creatorProfile.findUnique({
      where: { userId: creatorUserId },
      include: { defaultRoomTags: { include: { tag: true } } },
    })
    if (!creator) {
      const user = await db.user.findUnique({ where: { id: creatorUserId } })
      if (!user) throw httpError(404, 'User not found')
      creator = await db.creatorProfile.create({
        data: { userId: creatorUserId, status: 'PENDING' },
        include: { defaultRoomTags: { include: { tag: true } } },
      })
      await db.user.update({ where: { id: creatorUserId }, data: { role: 'CREATOR' } })
    }

    const category = this._resolveCategory(data.category, creator.defaultRoomCategory)
    const countryCode = this._resolveCountryCode(data.countryCode, creator.defaultCountryCode)
    const tagSlugs =
      data.tagSlugs !== undefined
        ? data.tagSlugs
        : creator.defaultRoomTags.map((entry) => entry.tag.slug)

    const tagIds = await this._resolveActiveTagIds(tagSlugs)

    const slug = data.slug ?? `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${nanoid(6)}`
    const livekitRoomName = `room-${nanoid(16)}`

    const room = await db.$transaction(async (tx) => {
      const created = await tx.room.create({
        data: {
          creatorId: creator.id,
          title: data.title,
          slug,
          livekitRoomName,
          visibility: (data.visibility as 'PUBLIC' | 'UNLISTED' | undefined) ?? 'PUBLIC',
          thumbnailMediaId: data.thumbnailMediaId,
          coverMediaId: data.coverMediaId,
          category,
          countryCode,
          tags: {
            create: tagIds.map((tagId) => ({ tagId })),
          },
        },
        include: ROOM_INCLUDES,
      })

      if (data.saveAsDefaults !== false) {
        await tx.creatorProfile.update({
          where: { id: creator.id },
          data: {
            defaultRoomCategory: category,
            defaultCountryCode: countryCode,
          },
        })
        await tx.creatorDefaultRoomTag.deleteMany({ where: { creatorId: creator.id } })
        if (tagIds.length > 0) {
          await tx.creatorDefaultRoomTag.createMany({
            data: tagIds.map((tagId) => ({ creatorId: creator.id, tagId })),
          })
        }
      }

      return created
    })

    return room
  }

  async goLive(creatorUserId: string, roomId: string) {
    const room = await this._assertCreatorOwnsRoom(creatorUserId, roomId)

    const creator = await db.creatorProfile.findUnique({ where: { id: room.creatorId } })
    if (creator?.isLive && creator.currentRoomId !== roomId) {
      throw httpError(400, 'You are already live in another room')
    }

    const missing = await this._goLiveEligibility(room)
    if (missing.length > 0) throw httpError(422, `Missing: ${missing.join(', ')}`)

    const updated = await db.room.update({
      where: { id: roomId },
      data: { status: 'LIVE', startedAt: new Date() },
      include: ROOM_INCLUDES,
    })

    await db.creatorProfile.update({
      where: { id: room.creatorId },
      data: { isLive: true, currentRoomId: roomId },
    })

    return updated
  }

  async endRoom(creatorUserId: string, roomId: string) {
    const room = await this._assertCreatorOwnsRoom(creatorUserId, roomId)

    const openSessions = await db.privateSession.findMany({
      where: { publicRoomId: roomId, status: { in: ['REQUESTED', 'ACCEPTED', 'ACTIVE'] } },
      include: { creator: true },
    })
    for (const session of openSessions) {
      try {
        if (session.status === 'ACTIVE') {
          await privateSessionService.end(session.creator.userId, session.id)
        } else {
          await privateSessionService.decline(session.creator.userId, session.id, { reason: 'Room ended' })
        }
      } catch (err) {
        console.error(`[RoomService] Failed to clean up session ${session.id}:`, err)
      }
    }

    const updated = await db.room.update({
      where: { id: roomId },
      data: { status: 'ENDED', endedAt: new Date() },
      include: ROOM_INCLUDES,
    })

    await db.creatorProfile.update({
      where: { id: room.creatorId },
      data: { isLive: false, currentRoomId: null },
    })

    await liveKitService.deleteRoom(room.livekitRoomName)

    return updated
  }

  async getGoLiveEligibility(creatorUserId: string, roomId: string) {
    const room = await this._assertCreatorOwnsRoom(creatorUserId, roomId)
    const missing = await this._goLiveEligibility(room)
    return { missing }
  }

  private _paginateRooms(rooms: Awaited<ReturnType<typeof db.room.findMany>>, limit: number) {
    const hasMore = rooms.length > limit
    if (hasMore) rooms.pop()

    const nextCursor = hasMore
      ? encodeCursor({
          createdAt: rooms[rooms.length - 1].createdAt.toISOString(),
          id: rooms[rooms.length - 1].id,
        })
      : null

    return { rooms: rooms.map(formatRoom), meta: { hasMore, nextCursor } }
  }

  private _resolveCategory(requested: string | undefined, fallback: RoomCategory | null) {
    if (requested !== undefined) {
      if (!isRoomCategory(requested)) throw httpError(400, 'Invalid room category')
      return requested
    }
    return fallback ?? null
  }

  private _resolveCountryCode(requested: string | undefined, fallback: string | null) {
    if (requested !== undefined) {
      const code = normalizeCountryCode(requested)
      if (!isValidCountryCode(code)) throw httpError(400, 'Invalid country code')
      return code
    }
    if (fallback) {
      const code = normalizeCountryCode(fallback)
      return isValidCountryCode(code) ? code : null
    }
    return null
  }

  private async _resolveActiveTagIds(tagSlugs: string[]) {
    if (tagSlugs.length > MAX_ROOM_TAGS) {
      throw httpError(400, `A room can have at most ${MAX_ROOM_TAGS} tags`)
    }
    if (tagSlugs.length === 0) return []

    const uniqueSlugs = [...new Set(tagSlugs)]
    const tags = await db.roomTag.findMany({
      where: { slug: { in: uniqueSlugs }, isActive: true },
    })
    if (tags.length !== uniqueSlugs.length) {
      throw httpError(400, 'One or more tags are invalid or inactive')
    }
    return tags.map((tag) => tag.id)
  }

  private async _goLiveEligibility(room: {
    creatorId: string
    thumbnailMediaId: string | null
    title: string
    category: RoomCategory | null
    countryCode: string | null
  }) {
    const missing: string[] = []
    const creator = await db.creatorProfile.findUnique({ where: { id: room.creatorId } })
    if (!creator) return ['CREATOR_NOT_APPROVED']

    if (creator.status !== 'ACTIVE') missing.push('CREATOR_NOT_APPROVED')
    if (!room.thumbnailMediaId) missing.push('ROOM_THUMBNAIL')
    if (!room.title?.trim()) missing.push('ROOM_TITLE')
    if (!room.category) missing.push('ROOM_CATEGORY')
    if (!room.countryCode) missing.push('ROOM_COUNTRY')
    if (!creator.privateRulesText?.trim()) missing.push('PRIVATE_RULES_TEXT')
    if (!creator.privateRateTokensPerMinute || creator.privateRateTokensPerMinute <= 0) {
      missing.push('PRIVATE_RATE')
    }

    const menuCount = await db.creatorMenuItem.count({
      where: { creatorId: creator.id, isActive: true },
    })
    if (menuCount === 0) missing.push('TIP_MENU')

    return missing
  }

  private async _assertCreatorOwnsRoom(creatorUserId: string, roomId: string) {
    const creator = await db.creatorProfile.findUnique({ where: { userId: creatorUserId } })
    if (!creator) throw httpError(403, 'Creator profile required')

    const room = await db.room.findUnique({ where: { id: roomId } })
    if (!room) throw httpError(404, 'Room not found')
    if (room.creatorId !== creator.id) throw httpError(403, 'Forbidden')

    return room
  }
}

type RoomTagAssignment = {
  tag: { slug: string; label: string; group: string | null }
}

type FormattableRoom = {
  id: string
  slug: string
  title: string
  status: string
  visibility: string
  thumbnailMediaId: string | null
  viewerCount: number
  category?: RoomCategory | null
  countryCode?: string | null
  startedAt: Date | null
  createdAt: Date
  creator?: {
    id?: string
    userId?: string
    isLive?: boolean
    status?: string
    privateRateTokensPerMinute?: number
    minPrivateMinutes?: number
    privateViewerCamRequired?: boolean
    privateScreenShareAllowed?: boolean
    user?: { displayName: string | null } | null
  } | null
  goal?: {
    id: string
    title: string
    targetTokens: number
    currentTokens: number
  } | null
  tags?: RoomTagAssignment[]
}

export function formatRoom(room: FormattableRoom) {
  return {
    id: room.id,
    slug: room.slug,
    title: room.title,
    status: room.status,
    visibility: room.visibility,
    category: room.category ?? null,
    countryCode: room.countryCode ?? null,
    countryName: room.countryCode ? getCountryName(room.countryCode) ?? null : null,
    tags: (room.tags ?? []).map((assignment) => ({
      slug: assignment.tag.slug,
      label: assignment.tag.label,
      group: assignment.tag.group,
    })),
    thumbnailUrl: room.thumbnailMediaId ? `/media/${room.thumbnailMediaId}` : null,
    viewerCount: room.viewerCount,
    privateAvailable: (room.creator?.privateRateTokensPerMinute ?? 0) > 0,
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
