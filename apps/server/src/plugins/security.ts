import { httpError } from '../lib/errors'
import { db } from '@streamyolo/db'

export async function bearerAuth(request: any, _reply: any, _params: any) {
  const token =
    request.cookies?.token ??
    request.headers.authorization?.replace('Bearer ', '')

  if (!token) throw httpError(401, 'Unauthorized')

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    throw httpError(401, 'Session expired')
  }

  if (session.user.suspendedAt) {
    throw httpError(403, 'Account suspended')
  }

  request.user = session.user
}

export async function adminAuth(request: any, reply: any, params: any) {
  await bearerAuth(request, reply, params)
  if (request.user.role !== 'ADMIN') {
    throw httpError(403, 'Forbidden')
  }
}
