import { db } from '@streamyolo/db'
import { PrivateSessionService, formatSession } from '../services/PrivateSessionService'

const sessionService = new PrivateSessionService()

export async function requestPrivateSession(request: any, reply: any) {
  const result = await sessionService.request(request.user.id, request.params.roomId, request.body ?? {})
  const io = (request.server as any).io
  if (io) {
    // Notify the creator
    io.to(`room:${request.params.roomId}`).emit('private:request_created', {
      privateSession: result.privateSession,
    })
    io.to(`user:${request.user.id}`).emit('wallet:update', result.wallet)
  }
  return reply.status(201).send({ data: result })
}

export async function acceptPrivateSession(request: any, reply: any) {
  const session = await sessionService.accept(request.user.id, request.params.sessionId)
  const io = (request.server as any).io
  if (io) {
    io.to(`user:${session.viewerId}`).emit('private:request_accepted', { privateSession: session })
  }
  return reply.send({ data: { privateSession: session } })
}

export async function declinePrivateSession(request: any, reply: any) {
  const session = await sessionService.decline(request.user.id, request.params.sessionId, request.body ?? {})
  const io = (request.server as any).io
  if (io) {
    io.to(`user:${session.viewerId}`).emit('private:request_declined', { privateSession: session })
  }
  return reply.send({ data: { privateSession: session } })
}

export async function startPrivateSession(request: any, reply: any) {
  const result = await sessionService.start(request.user.id, request.params.sessionId)
  const io = (request.server as any).io
  if (io) {
    const { privateSession } = result
    io.to(`user:${privateSession.viewerId}`).emit('private:session_started', { privateSession })
  }
  return reply.send({ data: result })
}

export async function endPrivateSession(request: any, reply: any) {
  const result = await sessionService.end(request.user.id, request.params.sessionId)
  const io = (request.server as any).io
  if (io) {
    const { privateSession } = result
    io.to(`user:${privateSession.viewerId}`).emit('private:session_ended', { privateSession })
    if (result.wallet) {
      io.to(`user:${privateSession.viewerId}`).emit('wallet:update', result.wallet)
    }
  }
  return reply.send({ data: result })
}

export async function getCreatorPrivateSessions(request: any, reply: any) {
  const room = await db.room.findUnique({
    where: { id: request.params.roomId },
    include: { creator: true },
  })
  if (!room) return reply.status(404).send({ error: 'Room not found' })
  if (room.creator.userId !== request.user.id) return reply.status(403).send({ error: 'Forbidden' })

  const sessions = await db.privateSession.findMany({
    where: {
      publicRoomId: request.params.roomId,
      creatorId: room.creatorId,
      status: { in: ['REQUESTED', 'ACCEPTED', 'ACTIVE'] },
    },
    include: { viewer: true },
    orderBy: { createdAt: 'asc' },
  })

  const formatted = sessions.map((s: any) => ({
    ...formatSession(s),
    viewer: {
      id: s.viewer.id,
      displayName: s.viewer.displayName ?? s.viewer.username ?? null,
      avatarMediaId: s.viewer.avatarMediaId ?? null,
    },
  }))

  return reply.send({ data: formatted })
}

