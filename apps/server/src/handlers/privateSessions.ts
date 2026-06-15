import { PrivateSessionService } from '../services/PrivateSessionService'

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
