import { MAX_ROOM_TAGS } from '@streamyolo/shared/room-taxonomy'
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

const FALLBACK_CATEGORIES = [
  { slug: 'education', label: 'Education' },
  { slug: 'music', label: 'Music' },
  { slug: 'business', label: 'Business' },
  { slug: 'entertainment', label: 'Entertainment' },
]

export const CREATOR_INCLUDE = {
  select: {
    id: true,
    userId: true,
    isLive: true,
    status: true,
    avatarMediaId: true,
    privateRateTokensPerMinute: true,
    minPrivateMinutes: true,
    privateViewerCamMode: true,
    privateScreenShareAllowed: true,
    user: {
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    },
  },
}

export const ROOM_INCLUDES = {
  creator: CREATOR_INCLUDE,
  goal: true,
  tags: { include: { tag: true } },
  privateSessions: {
    where: { status: 'ACTIVE' as const },
    select: { id: true },
    orderBy: { startedAt: 'desc' as const },
    take: 1,
  },
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
  mediaMode?: 'VIDEO' | 'AUDIO_ONLY'
}

export class RoomService {
  async getTaxonomy() {
    const [dbCategories, tags] = await Promise.all([
      db.roomCategory
        .findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] })
        .catch(() => null),
      db.roomTag.findMany({
        where: { isActive: true },
        orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }],
      }),
    ])

    const categories: Array<{ slug: string; label: string }> =
      Array.isArray(dbCategories) && dbCategories.length > 0 ? dbCategories : FALLBACK_CATEGORIES

    return {
      categories: categories.map((c) => ({ value: c.slug, label: c.label, slug: c.slug })),
      tags: tags.map((tag) => ({ slug: tag.slug, label: tag.label, group: tag.group })),
      countries: ISO_COUNTRIES.map((country) => ({ code: country.code, name: country.name })),
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
    const categories = this._expandCategoryFilters(params.categories ?? [])

    const rooms = await db.room.findMany({
      where: {
        status: (params.status as 'LIVE' | 'ENDED' | undefined) ?? 'LIVE',
        visibility: 'PUBLIC',
        ...(params.q ? { title: { contains: params.q } } : {}),
        ...(categories.length ? { category: { in: categories } } : {}),
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

  async getById(id: string) {
    const room = await db.room.findFirst({
      where: { id },
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

    const category = await this._resolveCategory(data.category, creator.defaultRoomCategory)
    const countryCode = this._resolveCountryCode(data.countryCode, creator.defaultCountryCode)
    const tagSlugs =
      data.tagSlugs !== undefined
        ? data.tagSlugs
        : creator.defaultRoomTags.map((entry) => entry.tag.slug)

    const tagIds = await this._resolveActiveTagIds(tagSlugs)

    const livekitRoomName = `room-${nanoid(16)}`

    const room = await db.$transaction(async (tx) => {
      const created = await tx.room.create({
        data: {
          creatorId: creator.id,
          title: data.title,
          livekitRoomName,
          visibility: (data.visibility as 'PUBLIC' | 'UNLISTED' | undefined) ?? 'PUBLIC',
          thumbnailMediaId: data.thumbnailMediaId,
          coverMediaId: data.coverMediaId,
          mediaMode: data.mediaMode ?? 'VIDEO',
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

  async update(creatorUserId: string, roomId: string, data: Partial<PrepareRoomData>) {
    const existing = await this._assertCreatorOwnsRoom(creatorUserId, roomId)
    if (existing.status !== 'DRAFT' && existing.status !== 'LIVE') {
      throw httpError(400, 'Cannot update a room that has ended')
    }

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.visibility !== undefined) updateData.visibility = data.visibility
    if (data.mediaMode !== undefined) updateData.mediaMode = data.mediaMode
    if (data.thumbnailMediaId !== undefined) updateData.thumbnailMediaId = data.thumbnailMediaId
    if (data.coverMediaId !== undefined) updateData.coverMediaId = data.coverMediaId
    if (data.category !== undefined) {
      const sameCategory = this._sameCategory(data.category, existing.category)
      if (existing.status === 'LIVE' && !sameCategory) {
        throw httpError(400, 'Cannot change category while room is live')
      }
      if (!sameCategory || existing.status !== 'LIVE') {
        updateData.category = await this._resolveCategory(data.category, existing.category)
      }
    }
    if (data.countryCode !== undefined) {
      if (existing.status === 'LIVE' && data.countryCode !== existing.countryCode) {
        throw httpError(400, 'Cannot change country while room is live')
      }
      updateData.countryCode = this._resolveCountryCode(data.countryCode, existing.countryCode)
    }

    const room = await db.$transaction(async (tx) => {
      if (data.tagSlugs !== undefined) {
        const tagIds = await this._resolveActiveTagIds(data.tagSlugs)
        await tx.roomTagAssignment.deleteMany({ where: { roomId } })
        if (tagIds.length > 0) {
          await tx.roomTagAssignment.createMany({
            data: tagIds.map((tagId) => ({ roomId, tagId })),
          })
        }
      }

      return tx.room.update({
        where: { id: roomId },
        data: updateData,
        include: ROOM_INCLUDES,
      })
    })

    return room
  }

  async goLive(creatorUserId: string, roomId: string) {
    const room = await this._assertCreatorOwnsRoom(creatorUserId, roomId)

    const missing = await this._goLiveEligibility(room)
    if (missing.length > 0) throw httpError(422, `Missing: ${missing.join(', ')}`)

    await db.$transaction(async (tx) => {
      // Atomic claim: UPDATE ... WHERE isLive = false ensures only one concurrent goLive wins
      const claim = await tx.creatorProfile.updateMany({
        where: { id: room.creatorId, isLive: false },
        data: { isLive: true, currentRoomId: roomId },
      })
      if (claim.count === 0) {
        throw httpError(400, 'You are already live in another room')
      }

      await tx.room.update({
        where: { id: roomId },
        data: { status: 'LIVE', startedAt: new Date(), endedAt: null },
      })
    })

    return db.room.findUniqueOrThrow({ where: { id: roomId }, include: ROOM_INCLUDES })
  }

  async endRoom(creatorUserId: string, roomId: string) {
    const room = await this._assertCreatorOwnsRoom(creatorUserId, roomId)

    if (room.status === 'ENDED') {
      // Idempotent: ensure profile is consistent even if somehow still marked live
      await db.creatorProfile.updateMany({
        where: { id: room.creatorId, isLive: true },
        data: { isLive: false, currentRoomId: null },
      })
      return db.room.findUniqueOrThrow({ where: { id: roomId }, include: ROOM_INCLUDES })
    }

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

  private async _resolveCategory(requested: string | undefined, fallback: string | null) {
    if (requested !== undefined) {
      const slug = requested.trim()
      if (!slug) throw httpError(400, 'Invalid room category')

      const candidates = [...new Set([slug, slug.toLowerCase()])]
      const categories = await db.roomCategory.findMany({
        where: { slug: { in: candidates }, isActive: true },
        take: 1,
      })
      if (categories[0]) return categories[0].slug

      const fallbackCategory = FALLBACK_CATEGORIES.find(
        (category) => category.slug.toLowerCase() === slug.toLowerCase(),
      )
      if (fallbackCategory) return fallbackCategory.slug

      throw httpError(400, 'Invalid room category')
    }
    return fallback ?? null
  }

  private _sameCategory(requested: string, existing: string | null) {
    return existing !== null && requested.trim().toLowerCase() === existing.trim().toLowerCase()
  }

  private _expandCategoryFilters(categories: string[]) {
    return [...new Set(categories.flatMap((category) => [category, category.toLowerCase()]))]
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
    category: string | null
    countryCode: string | null
  }) {
    const missing: string[] = []
    const creator = await db.creatorProfile.findUnique({ where: { id: room.creatorId } })
    if (!creator) return ['CREATOR_PROFILE_MISSING']

    if (creator.status !== 'ACTIVE') missing.push('CREATOR_NOT_APPROVED')
    if (room.mediaMode === 'VIDEO' && !room.thumbnailMediaId) missing.push('ROOM_THUMBNAIL')
    if (!room.title?.trim()) missing.push('ROOM_TITLE')
    if (!room.category) missing.push('ROOM_CATEGORY')
    if (!room.countryCode) missing.push('ROOM_COUNTRY')



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
  slug?: string
  title: string
  status: string
  visibility: string
  mediaMode: string
  thumbnailMediaId: string | null
  viewerCount: number
  category?: string | null
  countryCode?: string | null
  startedAt: Date | null
  createdAt: Date
  creator?: {
    id?: string
    userId?: string
    isLive?: boolean
    status?: string
    avatarMediaId?: string | null
    privateRateTokensPerMinute?: number
    minPrivateMinutes?: number
    privateViewerCamMode?: 'OFF' | 'OPTIONAL' | 'REQUIRED'
    privateScreenShareAllowed?: boolean
    user?: {
      id?: string
      username?: string | null
      displayName: string | null
      role?: string
      status?: string
      createdAt?: Date
    } | null
  } | null
  goal?: {
    id: string
    title: string
    targetTokens: number
    currentTokens: number
  } | null
  tags?: RoomTagAssignment[]
  privateSessions?: { id: string }[]
}

export function formatRoom(room: FormattableRoom) {
  return {
    id: room.id,
    title: room.title,
    status: room.status,
    visibility: room.visibility,
    mediaMode: room.mediaMode,
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
    activePrivateSessionId: room.privateSessions?.[0]?.id ?? null,
    privateAvailable: (room.creator?.privateRateTokensPerMinute ?? 0) > 0,
    privateRateTokensPerMinute: room.creator?.privateRateTokensPerMinute ?? null,
    minPrivateMinutes: room.creator?.minPrivateMinutes ?? 1,
    privateViewerCamMode: room.creator?.privateViewerCamMode ?? 'OPTIONAL',
    privateScreenShareAllowed: room.creator?.privateScreenShareAllowed ?? false,
    startedAt: room.startedAt?.toISOString() ?? null,
    createdAt: room.createdAt.toISOString(),
    creator: room.creator
      ? {
          id: room.creator.id,
          userId: room.creator.userId,
          displayName: room.creator.user?.displayName ?? 'Creator',
          avatarUrl: room.creator.avatarMediaId ? `/media/${room.creator.avatarMediaId}` : null,
          user: {
            id: room.creator.user?.id ?? room.creator.userId,
            username: room.creator.user?.username ?? 'unknown',
            displayName: room.creator.user?.displayName ?? 'Creator',
            role: room.creator.user?.role ?? 'VIEWER',
            status: room.creator.user?.status ?? 'ACTIVE',
            createdAt: room.creator.user?.createdAt?.toISOString() ?? new Date().toISOString(),
          },
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
