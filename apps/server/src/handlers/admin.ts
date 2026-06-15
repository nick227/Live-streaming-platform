import { AdminService } from '../services/AdminService'
import { formatReport } from '../services/ReportService'
import { CREATOR_INCLUDE, formatRoom } from '../services/RoomService'
import { db } from '@streamyolo/db'

const adminService = new AdminService()

// ── Formatters ──────────────────────────────────────────────────────────────

function formatAdminRoomCard(room: any) {
  return {
    id: room.id,
    creatorId: room.creatorId,
    creatorDisplayName: room.creator?.user?.displayName ?? 'Unknown',
    title: room.title,
    slug: room.slug,
    status: room.status,
    visibility: room.visibility,
    thumbnailUrl: room.thumbnailMediaId ? `/media/${room.thumbnailMediaId}` : null,
    viewerCount: room.viewerCount ?? 0,
    createdAt: room.createdAt?.toISOString() ?? new Date().toISOString(),
  }
}

function formatPublicUser(u: any) {
  if (!u) return undefined
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarMediaId ? `/media/${u.avatarMediaId}` : null,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt?.toISOString() ?? new Date().toISOString()
  }
}

function formatAdminUserDetail(u: any) {
  const detail: any = {
    user: formatPublicUser(u),
    wallet: u.wallet ? {
      tokenBalance: u.wallet.tokenBalance,
      reservedTokenBalance: u.wallet.reservedTokenBalance || 0,
      lifetimePurchasedTokens: u.wallet.lifetimePurchasedTokens || 0,
      lifetimeSpentTokens: u.wallet.lifetimeSpentTokens || 0
    } : { tokenBalance: 0, reservedTokenBalance: 0, lifetimePurchasedTokens: 0, lifetimeSpentTokens: 0 },
  }
  if (u.creatorProfile) detail.creatorProfile = formatCreatorProfileDetail({ ...u.creatorProfile, user: u })
  return detail
}

function formatCreatorProfileDetail(c: any) {
  return {
    id: c.id,
    userId: c.userId,
    displayName: c.user?.displayName ?? 'Unknown',
    bio: c.bio ?? null,
    avatarUrl: c.user?.avatarUrl ?? null,
    logoUrl: null, // Add if needed
    bannerUrl: null, // Add if needed
    status: c.status,
    isLive: false, // Or compute if needed
    currentRoomId: null, // Or compute if needed
    privateRateTokensPerMinute: c.privateRateTokensPerMinute || 0,
    minPrivateMinutes: c.minPrivateMinutes || 1,
    privateViewerCamRequired: c.privateViewerCamRequired ?? false,
    privateScreenShareAllowed: c.privateScreenShareAllowed ?? false,
    createdAt: c.createdAt.toISOString()
  }
}

export function formatPaymentTransactionDto(pt: any) {
  return {
    id: pt.id,
    userId: pt.userId,
    tokenPackId: pt.tokenPackId,
    provider: pt.provider,
    providerTxnId: pt.providerTxnId,
    amountCents: pt.amountCents,
    currency: pt.currency,
    tokensCredited: pt.tokensCredited,
    status: pt.status,
    createdAt: pt.createdAt.toISOString()
  }
}

export function formatPrivateSessionDto(s: any) {
  return {
    id: s.id,
    creatorId: s.creatorId,
    viewerId: s.viewerId,
    publicRoomId: s.publicRoomId,
    status: s.status,
    rateTokensPerMinute: s.rateTokensPerMinute,
    minMinutes: s.minMinutes || 1,
    viewerCamRequired: s.viewerCamRequired ?? false,
    screenShareAllowed: s.screenShareAllowed ?? false,
    rulesText: s.rulesText ?? null,
    reservedTokens: s.reservedTokens || 0,
    capturedTokens: s.capturedTokens || 0,
    releasedTokens: s.releasedTokens || 0,
    requestedAt: s.createdAt.toISOString(),
    startedAt: s.startedAt?.toISOString(),
    endedAt: s.endedAt?.toISOString(),
    createdAt: s.createdAt.toISOString()
  }
}

export function formatMediaAssetDto(m: any) {
  return {
    id: m.id,
    ownerUserId: m.ownerUserId,
    type: m.type,
    status: m.status,
    url: m.url,
    source: m.source,
    createdAt: m.createdAt?.toISOString() ?? new Date().toISOString()
  }
}

// ── Overview ────────────────────────────────────────────────────────────────

export async function getAdminOverview(_request: any, reply: any) {
  const data = await adminService.getOverview()
  return reply.send({ data })
}

// ── Rooms ────────────────────────────────────────────────────────────────────

export async function listAdminRooms(request: any, reply: any) {
  const { cursor, limit, status } = request.query ?? {}
  const result = await adminService.listRooms({ cursor, limit, status })
  return reply.send({ data: result.rooms.map(formatRoom), meta: result.meta })
}

export async function getAdminRoom(request: any, reply: any) {
  const room = await adminService.getRoom(request.params.roomId)
  return reply.send({ data: formatRoom(room) })
}

export async function adminEndRoom(request: any, reply: any) {
  const updated = await adminService.endRoom(request.user.id, request.params.roomId, request.body?.reason)
  const room = await db.room.findUnique({
    where: { id: updated.id },
    include: { creator: CREATOR_INCLUDE, goal: true },
  })
  const io = (request.server as any).io
  if (io) io.to(`room:${room!.id}`).emit('room:ended', { roomId: room!.id, reason: 'admin_action' })
  return reply.send({ data: { room: formatRoom(room!) } })
}

export async function adminHideRoom(request: any, reply: any) {
  const updated = await adminService.hideRoom(request.user.id, request.params.roomId, request.body?.reason)
  const room = await db.room.findUnique({
    where: { id: updated.id },
    include: { creator: CREATOR_INCLUDE, goal: true },
  })
  return reply.send({ data: { room: formatRoom(room!) } })
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function listAdminUsers(request: any, reply: any) {
  const { cursor, limit, q, role } = request.query ?? {}
  const result = await adminService.listUsers({ cursor, limit, q, role })
  return reply.send({ data: result.users.map(formatPublicUser), meta: result.meta })
}

export async function getAdminUser(request: any, reply: any) {
  const user = await adminService.getUser(request.params.userId)
  return reply.send({ data: formatAdminUserDetail(user) })
}

export async function adminSuspendUser(request: any, reply: any) {
  const updated = await adminService.suspendUser(request.user.id, request.params.userId, request.body?.reason)
  const user = await db.user.findUnique({
    where: { id: updated.id },
  })
  return reply.send({ data: formatPublicUser(user) })
}

export async function adminRestoreUser(request: any, reply: any) {
  const updated = await adminService.restoreUser(request.user.id, request.params.userId, request.body?.reason)
  const user = await db.user.findUnique({
    where: { id: updated.id },
  })
  return reply.send({ data: formatPublicUser(user) })
}

// ── Creators ─────────────────────────────────────────────────────────────────

export async function listAdminCreators(request: any, reply: any) {
  const { cursor, limit, status } = request.query ?? {}
  const result = await adminService.listCreators({ cursor, limit, status })
  return reply.send({ data: result.creators.map(formatCreatorProfileDetail), meta: result.meta })
}

export async function adminApproveCreator(request: any, reply: any) {
  const updated = await adminService.approveCreator(request.user.id, request.params.creatorId, request.body?.reason)
  const creator = await db.creatorProfile.findUnique({
    where: { id: updated.id },
    include: { user: true },
  })
  return reply.send({ data: formatCreatorProfileDetail(creator) })
}

export async function adminSuspendCreator(request: any, reply: any) {
  const updated = await adminService.suspendCreator(request.user.id, request.params.creatorId, request.body?.reason)
  const creator = await db.creatorProfile.findUnique({
    where: { id: updated.id },
    include: { user: true },
  })
  return reply.send({ data: formatCreatorProfileDetail(creator) })
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function listAdminPayments(request: any, reply: any) {
  const { cursor, limit, status } = request.query ?? {}
  const result = await adminService.listPayments({ cursor, limit, status })
  return reply.send({ data: result.payments.map(formatPaymentTransactionDto), meta: result.meta })
}

export async function getAdminPayment(request: any, reply: any) {
  const payment = await adminService.getPayment(request.params.paymentId)
  return reply.send({ data: { ...formatPaymentTransactionDto(payment), rawProviderJson: payment.rawProviderJson ?? null } })
}

// ── Wallets ───────────────────────────────────────────────────────────────────

export async function getAdminWallet(request: any, reply: any) {
  const walletObj = await adminService.getWallet(request.params.userId)
  const walletSummary = {
    tokenBalance: walletObj.tokenBalance,
    reservedTokenBalance: walletObj.reservedTokenBalance ?? 0,
    lifetimePurchasedTokens: walletObj.lifetimePurchasedTokens ?? 0,
    lifetimeSpentTokens: walletObj.lifetimeSpentTokens ?? 0
  }
  const ledger = walletObj.ledgerEntries.map((e: any) => ({
    id: e.id,
    walletId: e.walletId,
    type: e.type,
    amountTokens: e.amountTokens,
    balanceAfter: e.balanceAfter,
    referenceId: e.referenceId,
    createdAt: e.createdAt.toISOString()
  }))
  return reply.send({ data: { wallet: walletSummary, ledger, meta: { hasMore: false, nextCursor: null } } })
}

export async function adminAdjustWallet(request: any, reply: any) {
  const result = await adminService.adjustWallet(request.user.id, request.params.userId, request.body)
  const walletSummary = {
    tokenBalance: result.wallet.tokenBalance,
    reservedTokenBalance: result.wallet.reservedTokenBalance ?? 0,
    lifetimePurchasedTokens: result.wallet.lifetimePurchasedTokens ?? 0,
    lifetimeSpentTokens: result.wallet.lifetimeSpentTokens ?? 0
  }
  const ledgerEntry = {
    id: result.ledgerEntry.id,
    walletId: result.ledgerEntry.walletId,
    type: result.ledgerEntry.type,
    amountTokens: result.ledgerEntry.amountTokens,
    balanceAfter: result.ledgerEntry.balanceAfter,
    referenceId: result.ledgerEntry.referenceId,
    createdAt: result.ledgerEntry.createdAt.toISOString()
  }
  return reply.send({ data: { wallet: walletSummary, ledgerEntry } })
}

// ── Private sessions ──────────────────────────────────────────────────────────

export async function listAdminPrivateSessions(request: any, reply: any) {
  const { cursor, limit, status } = request.query ?? {}
  const result = await adminService.listPrivateSessions({ cursor, limit, status })
  return reply.send({ data: result.sessions.map(formatPrivateSessionDto), meta: result.meta })
}

export async function adminForceEndPrivateSession(request: any, reply: any) {
  const session = await adminService.forceEndPrivateSession(
    request.user.id,
    request.params.sessionId,
    request.body?.reason,
  )
  return reply.send({ data: { privateSession: formatPrivateSessionDto(session) } })
}

// ── Media ─────────────────────────────────────────────────────────────────────

export async function listAdminMedia(request: any, reply: any) {
  const { cursor, limit, status } = request.query ?? {}
  const result = await adminService.listMedia({ cursor, limit, status })
  return reply.send({ data: result.media.map(formatMediaAssetDto), meta: result.meta })
}

export async function adminApproveMedia(request: any, reply: any) {
  const media = await adminService.approveMedia(request.user.id, request.params.mediaId)
  return reply.send({ data: formatMediaAssetDto(media) })
}

export async function adminHideMedia(request: any, reply: any) {
  const media = await adminService.hideMedia(request.user.id, request.params.mediaId, request.body?.reason)
  return reply.send({ data: formatMediaAssetDto(media) })
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function listAdminReports(request: any, reply: any) {
  const { cursor, limit, status } = request.query ?? {}
  const result = await adminService.listReports({ cursor, limit, status })
  return reply.send({ data: result.reports.map(formatReport), meta: result.meta })
}

export async function adminReviewReport(request: any, reply: any) {
  const report = await adminService.reviewReport(request.user.id, request.params.reportId, request.body)
  return reply.send({ data: formatReport(report) })
}
