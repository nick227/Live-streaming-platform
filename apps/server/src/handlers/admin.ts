import { AdminService } from '../services/AdminService'
import { formatReport } from '../services/ReportService'

const adminService = new AdminService()

// ── Overview ────────────────────────────────────────────────────────────────

export async function getAdminOverview(_request: any, reply: any) {
  const data = await adminService.getOverview()
  return reply.send({ data })
}

// ── Rooms ────────────────────────────────────────────────────────────────────

export async function listAdminRooms(request: any, reply: any) {
  const { cursor, limit, status } = request.query ?? {}
  const result = await adminService.listRooms({ cursor, limit, status })
  return reply.send({ data: result.rooms, meta: result.meta })
}

export async function getAdminRoom(request: any, reply: any) {
  const room = await adminService.getRoom(request.params.roomId)
  return reply.send({ data: room })
}

export async function adminEndRoom(request: any, reply: any) {
  const room = await adminService.endRoom(request.user.id, request.params.roomId, request.body?.reason)
  const io = (request.server as any).io
  if (io) io.to(`room:${room.id}`).emit('room:ended', { roomId: room.id, reason: 'admin_action' })
  return reply.send({ data: { room } })
}

export async function adminHideRoom(request: any, reply: any) {
  const room = await adminService.hideRoom(request.user.id, request.params.roomId, request.body?.reason)
  return reply.send({ data: { room } })
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function listAdminUsers(request: any, reply: any) {
  const { cursor, limit, q, role } = request.query ?? {}
  const result = await adminService.listUsers({ cursor, limit, q, role })
  return reply.send({ data: result.users, meta: result.meta })
}

export async function getAdminUser(request: any, reply: any) {
  const user = await adminService.getUser(request.params.userId)
  return reply.send({ data: user })
}

export async function adminSuspendUser(request: any, reply: any) {
  const user = await adminService.suspendUser(request.user.id, request.params.userId, request.body?.reason)
  return reply.send({ data: { user } })
}

export async function adminRestoreUser(request: any, reply: any) {
  const user = await adminService.restoreUser(request.user.id, request.params.userId, request.body?.reason)
  return reply.send({ data: { user } })
}

// ── Creators ─────────────────────────────────────────────────────────────────

export async function listAdminCreators(request: any, reply: any) {
  const { cursor, limit, status } = request.query ?? {}
  const result = await adminService.listCreators({ cursor, limit, status })
  return reply.send({ data: result.creators, meta: result.meta })
}

export async function adminApproveCreator(request: any, reply: any) {
  const creator = await adminService.approveCreator(request.user.id, request.params.creatorId, request.body?.reason)
  return reply.send({ data: { creator } })
}

export async function adminSuspendCreator(request: any, reply: any) {
  const creator = await adminService.suspendCreator(request.user.id, request.params.creatorId, request.body?.reason)
  return reply.send({ data: { creator } })
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function listAdminPayments(request: any, reply: any) {
  const { cursor, limit, status } = request.query ?? {}
  const result = await adminService.listPayments({ cursor, limit, status })
  return reply.send({ data: result.payments, meta: result.meta })
}

export async function getAdminPayment(request: any, reply: any) {
  const payment = await adminService.getPayment(request.params.paymentId)
  return reply.send({ data: { payment } })
}

// ── Wallets ───────────────────────────────────────────────────────────────────

export async function getAdminWallet(request: any, reply: any) {
  const wallet = await adminService.getWallet(request.params.userId)
  return reply.send({ data: { wallet } })
}

export async function adminAdjustWallet(request: any, reply: any) {
  const wallet = await adminService.adjustWallet(request.user.id, request.params.userId, request.body)
  return reply.send({ data: { wallet } })
}

// ── Private sessions ──────────────────────────────────────────────────────────

export async function listAdminPrivateSessions(request: any, reply: any) {
  const { cursor, limit, status } = request.query ?? {}
  const result = await adminService.listPrivateSessions({ cursor, limit, status })
  return reply.send({ data: result.sessions, meta: result.meta })
}

export async function adminForceEndPrivateSession(request: any, reply: any) {
  const session = await adminService.forceEndPrivateSession(
    request.user.id,
    request.params.sessionId,
    request.body?.reason,
  )
  return reply.send({ data: { session } })
}

// ── Media ─────────────────────────────────────────────────────────────────────

export async function listAdminMedia(request: any, reply: any) {
  const { cursor, limit, status } = request.query ?? {}
  const result = await adminService.listMedia({ cursor, limit, status })
  return reply.send({ data: result.media, meta: result.meta })
}

export async function adminApproveMedia(request: any, reply: any) {
  const media = await adminService.approveMedia(request.user.id, request.params.mediaId)
  return reply.send({ data: { media } })
}

export async function adminHideMedia(request: any, reply: any) {
  const media = await adminService.hideMedia(request.user.id, request.params.mediaId, request.body?.reason)
  return reply.send({ data: { media } })
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function listAdminReports(request: any, reply: any) {
  const { cursor, limit, status } = request.query ?? {}
  const result = await adminService.listReports({ cursor, limit, status })
  return reply.send({ data: result.reports.map(formatReport), meta: result.meta })
}

export async function adminReviewReport(request: any, reply: any) {
  const report = await adminService.reviewReport(request.user.id, request.params.reportId, request.body)
  return reply.send({ data: { report: formatReport(report) } })
}
