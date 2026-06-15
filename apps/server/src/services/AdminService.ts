import { db } from '@streamyolo/db'
import { encodeCursor, decodeCursor, normalizeLimit } from '../lib/pagination'

export class AdminService {
  // ── Overview ───────────────────────────────────────────────────────────────

  async getOverview() {
    const [totalUsers, totalCreators, liveRooms, pendingReports, pendingMedia] = await Promise.all([
      db.user.count(),
      db.creatorProfile.count(),
      db.room.count({ where: { status: 'LIVE' } }),
      db.report.count({ where: { status: 'PENDING' } }),
      db.mediaAsset.count({ where: { status: 'PENDING' } }),
    ])
    return { totalUsers, totalCreators, liveRooms, pendingReports, pendingMedia }
  }

  // ── Rooms ──────────────────────────────────────────────────────────────────

  async listRooms(params: { cursor?: string; limit?: number; status?: string }) {
    const limit = normalizeLimit(params.limit)
    const cursorPayload = decodeCursor(params.cursor)

    const rooms = await db.room.findMany({
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
      include: { creator: { select: { id: true, userId: true, user: { select: { displayName: true } } } } },
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
      include: { creator: { select: { id: true, userId: true, user: { select: { displayName: true } } } }, goal: true },
    })
    if (!room) throw { statusCode: 404, message: 'Room not found' }
    return room
  }

  async endRoom(adminId: string, roomId: string, reason?: string) {
    const room = await db.room.findUnique({ where: { id: roomId } })
    if (!room) throw { statusCode: 404, message: 'Room not found' }

    const [updated] = await db.$transaction([
      db.room.update({ where: { id: roomId }, data: { status: 'ENDED', endedAt: new Date() } }),
      db.adminAction.create({
        data: { adminUserId: adminId, targetRoomId: roomId, type: 'END_ROOM', reason },
      }),
    ])
    return updated
  }

  async hideRoom(adminId: string, roomId: string, reason?: string) {
    const room = await db.room.findUnique({ where: { id: roomId } })
    if (!room) throw { statusCode: 404, message: 'Room not found' }

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
    if (!user) throw { statusCode: 404, message: 'User not found' }
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
      include: { user: { select: { id: true, displayName: true, email: true } } },
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
    if (!payment) throw { statusCode: 404, message: 'Payment not found' }
    return payment
  }

  // ── Wallets ────────────────────────────────────────────────────────────────

  async getWallet(userId: string) {
    const wallet = await db.wallet.findUnique({
      where: { userId },
      include: { ledgerEntries: { orderBy: { createdAt: 'desc' }, take: 50 } },
    })
    if (!wallet) throw { statusCode: 404, message: 'Wallet not found' }
    return wallet
  }

  async adjustWallet(adminId: string, userId: string, data: { amountTokens: number; reason: string }) {
    let wallet = await db.wallet.findUnique({ where: { userId } })
    if (!wallet) wallet = await db.wallet.create({ data: { userId } })

    const [updatedWallet] = await db.$transaction(async (tx: any) => {
      const w = await tx.wallet.update({
        where: { userId },
        data: { tokenBalance: { increment: data.amountTokens } },
      })

      const a = await tx.adminAction.create({
        data: { adminUserId: adminId, targetUserId: userId, type: 'ADJUST_WALLET', reason: data.reason },
      })

      await tx.ledgerEntry.create({
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

      return [w, a]
    })

    return updatedWallet
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
    if (!session) throw { statusCode: 404, message: 'Session not found' }

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
    if (!asset) throw { statusCode: 404, message: 'Media not found' }
    return db.mediaAsset.update({ where: { id: mediaId }, data: { status: 'APPROVED' } })
  }

  async hideMedia(adminId: string, mediaId: string, _reason?: string) {
    const asset = await db.mediaAsset.findUnique({ where: { id: mediaId } })
    if (!asset) throw { statusCode: 404, message: 'Media not found' }
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
    if (!report) throw { statusCode: 404, message: 'Report not found' }

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
}
