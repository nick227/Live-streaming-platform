import { httpError } from '../lib/errors'
import { db } from '@streamyolo/db'
import { encodeCursor, decodeCursor, normalizeLimit } from '../lib/pagination'
import { CREATOR_INCLUDE } from './RoomService'
import { LiveKitService } from './LiveKitService'

const liveKitService = new LiveKitService()

export class AdminService {
  // ── Overview ───────────────────────────────────────────────────────────────

  async getOverview() {
    const [totalUsers, totalCreators, liveRoomCount, pendingReports, pendingPayments, activePrivateSessions] = await Promise.all([
      db.user.count(),
      db.creatorProfile.count(),
      db.room.count({ where: { status: 'LIVE' } }),
      db.report.count({ where: { status: 'PENDING' } }),
      db.paymentTransaction.count({ where: { status: 'PENDING' } }),
      db.privateSession.count({ where: { status: 'ACTIVE' } }),
    ])
    return { 
      totalUsers, 
      totalCreators, 
      liveRoomCount, 
      pendingReports, 
      pendingPayments, 
      activePrivateSessions,
      totalTokensPurchasedToday: 0,
      totalRevenueCentsToday: 0
    }
  }

  // ── Rooms ──────────────────────────────────────────────────────────────────

  async listRooms(params: { cursor?: string; limit?: number; status?: string }) {
    const limit = normalizeLimit(params.limit)
    const cursorPayload = decodeCursor(params.cursor)

    const rooms = await db.room.findMany({
      where: {
        ...(params.status ? { status: params.status as any } : { status: { not: 'HIDDEN' as any } }),
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

    return { rooms, meta: { hasMore, nextCursor } }
  }

  async getRoom(roomId: string) {
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { creator: CREATOR_INCLUDE, goal: true },
    })
    if (!room) throw httpError(404, 'Room not found')
    return room
  }

  async endRoom(adminId: string, roomId: string, reason?: string) {
    const room = await db.room.findUnique({ where: { id: roomId } })
    if (!room) throw httpError(404, 'Room not found')

    const [updated] = await db.$transaction([
      db.room.update({ where: { id: roomId }, data: { status: 'ENDED', endedAt: new Date() } }),
      db.adminAction.create({
        data: { adminUserId: adminId, targetRoomId: roomId, type: 'END_ROOM', reason },
      }),
    ])

    // Clear the creator's live state so their profile reflects the correct status
    await db.creatorProfile.updateMany({
      where: { id: room.creatorId, isLive: true },
      data: { isLive: false, currentRoomId: null },
    })

    await liveKitService.deleteRoom(room.livekitRoomName)

    return updated
  }

  async hideRoom(adminId: string, roomId: string, reason?: string) {
    const room = await db.room.findUnique({ where: { id: roomId } })
    if (!room) throw httpError(404, 'Room not found')

    const [updated] = await db.$transaction([
      db.room.update({ where: { id: roomId }, data: { status: 'HIDDEN' } }),
      db.adminAction.create({
        data: { adminUserId: adminId, targetRoomId: roomId, type: 'HIDE_ROOM', reason },
      }),
    ])
    return updated
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  async listUsers(params: { cursor?: string; limit?: number; q?: string; role?: string }) {
    const limit = normalizeLimit(params.limit)
    const cursorPayload = decodeCursor(params.cursor)

    const users = await db.user.findMany({
      where: {
        ...(params.role ? { role: params.role as any } : {}),
        ...(params.q
          ? { OR: [{ displayName: { contains: params.q } }, { email: { contains: params.q } }, { username: { contains: params.q } }] }
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
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    })

    const hasMore = users.length > limit
    if (hasMore) users.pop()

    const nextCursor = hasMore
      ? encodeCursor({ createdAt: users[users.length - 1].createdAt.toISOString(), id: users[users.length - 1].id })
      : null

    return { users, meta: { hasMore, nextCursor } }
  }

  async getUser(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        creatorProfile: true,
        wallet: true,
      },
    })
    if (!user) throw httpError(404, 'User not found')
    return user
  }

  async suspendUser(adminId: string, userId: string, reason?: string) {
    const [user] = await db.$transaction([
      db.user.update({ where: { id: userId }, data: { suspendedAt: new Date(), status: 'SUSPENDED' } }),
      db.adminAction.create({ data: { adminUserId: adminId, targetUserId: userId, type: 'SUSPEND_USER', reason } }),
    ])
    return user
  }

  async restoreUser(adminId: string, userId: string, reason?: string) {
    const [user] = await db.$transaction([
      db.user.update({ where: { id: userId }, data: { suspendedAt: null, status: 'ACTIVE' } }),
      db.adminAction.create({ data: { adminUserId: adminId, targetUserId: userId, type: 'RESTORE_USER', reason } }),
    ])
    return user
  }

  async getUserWallet(userId: string, params: { cursor?: string; limit?: number }) {
    const limit = normalizeLimit(params.limit)
    const cursorPayload = decodeCursor(params.cursor)

    const wallet = await db.wallet.findUnique({ where: { userId } })
    if (!wallet) return { wallet: null, ledger: [], meta: { hasMore: false, nextCursor: null } }

    const ledger = await db.ledgerEntry.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursorPayload
        ? {
            cursor: { id: cursorPayload.id as string },
            skip: 1,
          }
        : {}),
    })

    const hasMore = ledger.length > limit
    if (hasMore) ledger.pop()

    const nextCursor = hasMore && ledger.length
      ? encodeCursor({
          createdAt: ledger[ledger.length - 1].createdAt.toISOString(),
          id: ledger[ledger.length - 1].id,
        })
      : null

    return { wallet, ledger, meta: { hasMore, nextCursor } }
  }

  async grantTokens(adminId: string, userId: string, amountTokens: number, reason: string) {
    const result = await db.$transaction(async (tx: any) => {
      const wallet = await tx.wallet.upsert({
        where: { userId },
        create: { userId, tokenBalance: amountTokens, lifetimePurchasedTokens: 0 },
        update: { tokenBalance: { increment: amountTokens } },
      })

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'ADMIN_ADJUSTMENT',
          amountTokens,
          balanceAfter: wallet.tokenBalance,
          description: `Admin Grant: ${reason}`,
        },
      })

      await tx.adminAction.create({
        data: { adminUserId: adminId, targetUserId: userId, type: 'GRANT_TOKENS', reason, metadataJson: { amountTokens } },
      })

      return wallet
    })
    return result
  }

  async revokeTokens(adminId: string, userId: string, amountTokens: number, reason: string) {
    const result = await db.$transaction(async (tx: any) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } })
      if (!wallet) throw httpError(404, 'Wallet not found')
      if (wallet.tokenBalance < amountTokens) throw httpError(400, 'Cannot revoke more than current balance')

      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { tokenBalance: { decrement: amountTokens } },
      })

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'ADMIN_ADJUSTMENT',
          amountTokens: -amountTokens,
          balanceAfter: updated.tokenBalance,
          description: `Admin Revoke: ${reason}`,
        },
      })

      await tx.adminAction.create({
        data: { adminUserId: adminId, targetUserId: userId, type: 'REVOKE_TOKENS', reason, metadataJson: { amountTokens } },
      })

      return updated
    })
    return result
  }

  async resetWallet(adminId: string, userId: string, reason: string) {
    const result = await db.$transaction(async (tx: any) => {
      let wallet = await tx.wallet.findUnique({ where: { userId } })
      if (!wallet || wallet.tokenBalance === 0) return wallet

      const removed = wallet.tokenBalance

      wallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { tokenBalance: 0 },
      })

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'TEST_RESET',
          amountTokens: -removed,
          balanceAfter: 0,
          description: `Admin Reset: ${reason}`,
        },
      })

      await tx.adminAction.create({
        data: { adminUserId: adminId, targetUserId: userId, type: 'RESET_WALLET', reason, metadataJson: { removed } },
      })

      return wallet
    })
    return result
  }

  // ── Creators ───────────────────────────────────────────────────────────────

  async listCreators(params: { cursor?: string; limit?: number; status?: string }) {
    const limit = normalizeLimit(params.limit)
    const cursorPayload = decodeCursor(params.cursor)

    const creators = await db.creatorProfile.findMany({
      where: {
        ...(params.status ? { status: params.status as any } : {}),
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
        user: { select: { id: true, username: true, displayName: true, email: true } },
        defaultRoomTags: { include: { tag: { select: { slug: true, label: true, group: true } } } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    })

    const hasMore = creators.length > limit
    if (hasMore) creators.pop()

    const nextCursor = hasMore
      ? encodeCursor({
          createdAt: creators[creators.length - 1].createdAt.toISOString(),
          id: creators[creators.length - 1].id,
        })
      : null

    return { creators, meta: { hasMore, nextCursor } }
  }

  async approveCreator(adminId: string, creatorId: string, reason?: string) {
    const [creator] = await db.$transaction([
      db.creatorProfile.update({ where: { id: creatorId }, data: { status: 'ACTIVE' } }),
      db.adminAction.create({ data: { adminUserId: adminId, type: 'APPROVE_CREATOR', reason } }),
    ])
    return creator
  }

  async suspendCreator(adminId: string, creatorId: string, reason?: string) {
    const [creator] = await db.$transaction([
      db.creatorProfile.update({ where: { id: creatorId }, data: { status: 'SUSPENDED' } }),
      db.adminAction.create({ data: { adminUserId: adminId, type: 'SUSPEND_CREATOR', reason } }),
    ])
    return creator
  }

  // ── Payments ───────────────────────────────────────────────────────────────

  async listPayments(params: { cursor?: string; limit?: number; status?: string }) {
    const limit = normalizeLimit(params.limit)
    const cursorPayload = decodeCursor(params.cursor)

    const payments = await db.paymentTransaction.findMany({
      where: {
        ...(params.status ? { status: params.status as any } : {}),
        ...(cursorPayload
          ? {
              OR: [
                { createdAt: { lt: new Date(cursorPayload.createdAt) } },
                { createdAt: new Date(cursorPayload.createdAt), id: { lt: cursorPayload.id } },
              ],
            }
          : {}),
      },
      include: { tokenPack: { select: { name: true } }, user: { select: { id: true, username: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    })

    const hasMore = payments.length > limit
    if (hasMore) payments.pop()

    const nextCursor = hasMore
      ? encodeCursor({
          createdAt: payments[payments.length - 1].createdAt.toISOString(),
          id: payments[payments.length - 1].id,
        })
      : null

    return { payments, meta: { hasMore, nextCursor } }
  }

  async getPayment(paymentId: string) {
    const payment = await db.paymentTransaction.findUnique({
      where: { id: paymentId },
      include: { tokenPack: true, user: { select: { id: true, username: true, email: true } } },
    })
    if (!payment) throw httpError(404, 'Payment not found')
    return payment
  }

  // ── Wallets ────────────────────────────────────────────────────────────────

  async getWallet(userId: string) {
    const wallet = await db.wallet.findUnique({
      where: { userId },
      include: { ledgerEntries: { orderBy: { createdAt: 'desc' }, take: 50 } },
    })
    if (!wallet) throw httpError(404, 'Wallet not found')
    return wallet
  }

  async adjustWallet(adminId: string, userId: string, data: { amountTokens: number; reason: string }) {
    let wallet = await db.wallet.findUnique({ where: { userId } })
    if (!wallet) wallet = await db.wallet.create({ data: { userId } })

    const [updatedWallet, _, updatedLedgerEntry] = await db.$transaction(async (tx: any) => {
      const w = await tx.wallet.update({
        where: { userId },
        data: { tokenBalance: { increment: data.amountTokens } },
      })

      const a = await tx.adminAction.create({
        data: { adminUserId: adminId, targetUserId: userId, type: 'ADJUST_WALLET', reason: data.reason },
      })

      const le = await tx.ledgerEntry.create({
        data: {
          walletId: wallet!.id,
          userId,
          type: 'ADMIN_ADJUSTMENT',
          amountTokens: data.amountTokens,
          balanceAfter: w.tokenBalance,
          adminActionId: a.id,
          description: data.reason,
        },
      })

      return [w, a, le]
    })

    return { wallet: updatedWallet, ledgerEntry: updatedLedgerEntry }
  }

  // ── Private sessions ───────────────────────────────────────────────────────

  async listPrivateSessions(params: { cursor?: string; limit?: number; status?: string }) {
    const limit = normalizeLimit(params.limit)
    const cursorPayload = decodeCursor(params.cursor)

    const sessions = await db.privateSession.findMany({
      where: {
        ...(params.status ? { status: params.status as any } : {}),
        ...(cursorPayload
          ? {
              OR: [
                { createdAt: { lt: new Date(cursorPayload.createdAt) } },
                { createdAt: new Date(cursorPayload.createdAt), id: { lt: cursorPayload.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    })

    const hasMore = sessions.length > limit
    if (hasMore) sessions.pop()

    const nextCursor = hasMore
      ? encodeCursor({
          createdAt: sessions[sessions.length - 1].createdAt.toISOString(),
          id: sessions[sessions.length - 1].id,
        })
      : null

    return { sessions, meta: { hasMore, nextCursor } }
  }

  async forceEndPrivateSession(adminId: string, sessionId: string, reason?: string) {
    const session = await db.privateSession.findUnique({ where: { id: sessionId } })
    if (!session) throw httpError(404, 'Session not found')

    const [updated] = await db.$transaction([
      db.privateSession.update({
        where: { id: sessionId },
        data: { status: 'FORCE_ENDED', endedAt: new Date() },
      }),
      db.adminAction.create({ data: { adminUserId: adminId, type: 'FORCE_END_SESSION', reason } }),
    ])
    return updated
  }

  // ── Media ──────────────────────────────────────────────────────────────────

  async listMedia(params: { cursor?: string; limit?: number; status?: string }) {
    const limit = normalizeLimit(params.limit)
    const cursorPayload = decodeCursor(params.cursor)

    const media = await db.mediaAsset.findMany({
      where: {
        ...(params.status ? { status: params.status as any } : {}),
        ...(cursorPayload
          ? {
              OR: [
                { createdAt: { lt: new Date(cursorPayload.createdAt) } },
                { createdAt: new Date(cursorPayload.createdAt), id: { lt: cursorPayload.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    })

    const hasMore = media.length > limit
    if (hasMore) media.pop()

    const nextCursor = hasMore
      ? encodeCursor({ createdAt: media[media.length - 1].createdAt.toISOString(), id: media[media.length - 1].id })
      : null

    return { media, meta: { hasMore, nextCursor } }
  }

  async approveMedia(adminId: string, mediaId: string) {
    const asset = await db.mediaAsset.findUnique({ where: { id: mediaId } })
    if (!asset) throw httpError(404, 'Media not found')
    return db.mediaAsset.update({ where: { id: mediaId }, data: { status: 'APPROVED' } })
  }

  async hideMedia(adminId: string, mediaId: string, _reason?: string) {
    const asset = await db.mediaAsset.findUnique({ where: { id: mediaId } })
    if (!asset) throw httpError(404, 'Media not found')
    return db.mediaAsset.update({ where: { id: mediaId }, data: { status: 'HIDDEN' } })
  }

  // ── Reports ────────────────────────────────────────────────────────────────

  async listReports(params: { cursor?: string; limit?: number; status?: string }) {
    const limit = normalizeLimit(params.limit)
    const cursorPayload = decodeCursor(params.cursor)

    const reports = await db.report.findMany({
      where: {
        ...(params.status ? { status: params.status as any } : {}),
        ...(cursorPayload
          ? {
              OR: [
                { createdAt: { lt: new Date(cursorPayload.createdAt) } },
                { createdAt: new Date(cursorPayload.createdAt), id: { lt: cursorPayload.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    })

    const hasMore = reports.length > limit
    if (hasMore) reports.pop()

    const nextCursor = hasMore
      ? encodeCursor({ createdAt: reports[reports.length - 1].createdAt.toISOString(), id: reports[reports.length - 1].id })
      : null

    return { reports, meta: { hasMore, nextCursor } }
  }

  async reviewReport(adminId: string, reportId: string, data: { status: 'REVIEWED' | 'ACTIONED' | 'DISMISSED'; adminNotes?: string }) {
    const report = await db.report.findUnique({ where: { id: reportId } })
    if (!report) throw httpError(404, 'Report not found')

    return db.report.update({
      where: { id: reportId },
      data: {
        status: data.status,
        reviewedAt: new Date(),
        reviewedById: adminId,
        adminNotes: data.adminNotes,
      },
    })
  }

  // ── Creators (detail) ──────────────────────────────────────────────────────

  async getCreator(creatorId: string) {
    const creator = await db.creatorProfile.findUnique({
      where: { id: creatorId },
      include: {
        user: true,
        defaultRoomTags: { include: { tag: { select: { slug: true, label: true, group: true } } } },
        rooms: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, title: true, status: true, category: true, countryCode: true, viewerCount: true, startedAt: true, endedAt: true, createdAt: true },
        },
      },
    })
    if (!creator) throw httpError(404, 'Creator not found')
    return creator
  }

  // ── Categories ────────────────────────────────────────────────────────────

  async listCategories() {
    return db.roomCategory.findMany({ orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] })
  }

  async createCategory(data: { slug: string; label: string; sortOrder?: number }) {
    const existing = await db.roomCategory.findUnique({ where: { slug: data.slug } })
    if (existing) throw httpError(409, 'Category slug already exists')
    return db.roomCategory.create({ data: { slug: data.slug, label: data.label, sortOrder: data.sortOrder ?? 0 } })
  }

  async updateCategory(categoryId: string, data: { label?: string; sortOrder?: number; isActive?: boolean }) {
    const cat = await db.roomCategory.findUnique({ where: { id: categoryId } })
    if (!cat) throw httpError(404, 'Category not found')
    return db.roomCategory.update({ where: { id: categoryId }, data })
  }

  async deleteCategory(categoryId: string) {
    const cat = await db.roomCategory.findUnique({ where: { id: categoryId } })
    if (!cat) throw httpError(404, 'Category not found')
    await db.roomCategory.delete({ where: { id: categoryId } })
    return { ok: true }
  }

  // ── Tags ──────────────────────────────────────────────────────────────────

  async listTags() {
    return db.roomTag.findMany({ orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] })
  }

  async createTag(data: { slug: string; label: string; group?: string; sortOrder?: number }) {
    const existing = await db.roomTag.findUnique({ where: { slug: data.slug } })
    if (existing) throw httpError(409, 'Tag slug already exists')
    return db.roomTag.create({ data: { slug: data.slug, label: data.label, group: data.group, sortOrder: data.sortOrder ?? 0 } })
  }

  async updateTag(tagId: string, data: { label?: string; group?: string; sortOrder?: number; isActive?: boolean }) {
    const tag = await db.roomTag.findUnique({ where: { id: tagId } })
    if (!tag) throw httpError(404, 'Tag not found')
    return db.roomTag.update({ where: { id: tagId }, data })
  }

  async deleteTag(tagId: string) {
    const tag = await db.roomTag.findUnique({ where: { id: tagId } })
    if (!tag) throw httpError(404, 'Tag not found')
    await db.$transaction([
      db.roomTagAssignment.deleteMany({ where: { tagId } }),
      db.creatorDefaultRoomTag.deleteMany({ where: { tagId } }),
      db.roomTag.delete({ where: { id: tagId } }),
    ])
    return { ok: true }
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  async getSettings() {
    let settings = await db.platformSettings.findUnique({ where: { id: 'singleton' } })
    if (!settings) {
      settings = await db.platformSettings.create({ data: { id: 'singleton', activePaymentProvider: 'DEMO' } })
    }
    return {
      activePaymentProvider: settings.activePaymentProvider,
      tokenPurchasesEnabled: settings.tokenPurchasesEnabled,
    }
  }

  async updateSettings(adminId: string, provider: 'CCBILL' | 'DEMO', tokenPurchasesEnabled?: boolean) {
    if (
      process.env.NODE_ENV === 'production' &&
      provider === 'DEMO' &&
      process.env.ALLOW_DEMO_PAYMENTS_IN_PRODUCTION !== 'true'
    ) {
      throw httpError(400, 'DEMO payments are disabled in production')
    }

    let settings = await db.platformSettings.findUnique({ where: { id: 'singleton' } })
    const data: any = { activePaymentProvider: provider }
    if (tokenPurchasesEnabled !== undefined) data.tokenPurchasesEnabled = tokenPurchasesEnabled

    if (!settings) {
      settings = await db.platformSettings.create({ data: { id: 'singleton', ...data } })
    } else {
      settings = await db.platformSettings.update({ where: { id: 'singleton' }, data })
    }

    await db.adminAction.create({
      data: { adminUserId: adminId, type: 'PAYMENT_PROVIDER_CHANGED', metadataJson: { to: provider, tokenPurchasesEnabled } },
    })

    return {
      activePaymentProvider: settings.activePaymentProvider,
      tokenPurchasesEnabled: settings.tokenPurchasesEnabled,
    }
  }

  // ── Token Packs ────────────────────────────────────────────────────────────

  async listAllTokenPacks() {
    return db.tokenPack.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] })
  }

  async createTokenPack(data: { name: string; priceCents: number; tokenAmount: number; bonusTokenAmount?: number; currency?: string; isActive?: boolean; sortOrder?: number }) {
    return db.tokenPack.create({ data: { ...data, bonusTokenAmount: data.bonusTokenAmount ?? 0, currency: data.currency ?? 'USD', isActive: data.isActive ?? true, sortOrder: data.sortOrder ?? 0 } })
  }

  async updateTokenPack(packId: string, data: { name?: string; priceCents?: number; tokenAmount?: number; bonusTokenAmount?: number; isActive?: boolean; sortOrder?: number }) {
    const pack = await db.tokenPack.findUnique({ where: { id: packId } })
    if (!pack) throw httpError(404, 'Token pack not found')
    return db.tokenPack.update({ where: { id: packId }, data })
  }

  async deleteTokenPack(packId: string) {
    const pack = await db.tokenPack.findUnique({ where: { id: packId } })
    if (!pack) throw httpError(404, 'Token pack not found')
    await db.tokenPack.delete({ where: { id: packId } })
    return { ok: true }
  }
}
