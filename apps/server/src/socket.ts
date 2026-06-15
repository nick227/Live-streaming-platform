import { Server as SocketIOServer } from 'socket.io'
import type { FastifyInstance } from 'fastify'
import type { ServerToClientEvents, ClientToServerEvents } from '@streamyolo/shared'
import { db } from '@streamyolo/db'
import { ModerationService } from './services/ModerationService'

const moderationService = new ModerationService()

export function attachSocketIO(server: FastifyInstance) {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(server.server, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
      credentials: true,
    },
  })

  // Verify session token on every socket connection
  io.use(async (socket, next) => {
    let token = socket.handshake.auth?.token as string | undefined
    if (!token && socket.handshake.headers.cookie) {
      const match = socket.handshake.headers.cookie.match(/token=([^;]+)/)
      if (match) token = match[1]
    }
    if (!token) return next(new Error('Unauthorized'))
    try {
      const session = await db.session.findUnique({
        where: { token },
        include: { user: true },
      })
      if (!session || session.expiresAt < new Date()) return next(new Error('Unauthorized'))
      if (session.user.suspendedAt) return next(new Error('Account suspended'))
      ;(socket as any).userId = session.user.id
      socket.data.userId = session.user.id
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  async function decrementViewerCount(roomId: string) {
    await db.room.updateMany({
      where: { id: roomId, viewerCount: { gt: 0 } },
      data: { viewerCount: { decrement: 1 } },
    })
    const room = await db.room.findUnique({ where: { id: roomId }, select: { viewerCount: true } })
    if (room) io.to(`room:${roomId}`).emit('room:viewer_count', { roomId, viewerCount: room.viewerCount })
  }

  io.on('connection', (socket) => {
    socket.on('room:join', async ({ roomId }, ack) => {
      try {
        const userId = (socket as any).userId
        const allowed = await moderationService.canJoinRoom(userId, roomId)
        if (!allowed.ok) {
          ack?.({ ok: false, error: allowed.error })
          return
        }
        socket.join(`room:${roomId}`)

        if (!socket.data.joinedRooms) socket.data.joinedRooms = new Set<string>()
        ;(socket.data.joinedRooms as Set<string>).add(roomId)

        const room = await db.room.update({
          where: { id: roomId },
          data: { viewerCount: { increment: 1 } },
          select: { viewerCount: true },
        })
        ack?.({ ok: true })
        io.to(`room:${roomId}`).emit('room:viewer_count', { roomId, viewerCount: room.viewerCount })
      } catch {
        socket.leave(`room:${roomId}`)
        ;(socket.data.joinedRooms as Set<string> | undefined)?.delete(roomId)
        ack?.({ ok: false, error: 'Failed to join room' })
      }
    })

    socket.on('room:leave', async ({ roomId }) => {
      socket.leave(`room:${roomId}`)
      ;(socket.data.joinedRooms as Set<string> | undefined)?.delete(roomId)
      await decrementViewerCount(roomId).catch(() => {})
    })

    socket.on('disconnect', async () => {
      const joinedRooms = socket.data.joinedRooms as Set<string> | undefined
      if (!joinedRooms?.size) return
      for (const roomId of joinedRooms) {
        await decrementViewerCount(roomId).catch(() => {})
      }
    })

    socket.on('chat:send', async ({ roomId, body }, ack) => {
      // Chat messages go through the REST tip handler and are broadcast there.
      // This socket event is a real-time shortcut for simple chat — no token deduction.
      try {
        const userId = (socket as any).userId
        const allowed = await moderationService.canSendChat(userId, roomId)
        if (!allowed.ok) {
          ack?.({ ok: false, error: allowed.error })
          return
        }
        const msg = await db.chatMessage.create({
          data: {
            roomId,
            userId,
            type: 'USER_MESSAGE',
            body,
          },
          include: { user: { select: { id: true, displayName: true } } },
        })
        const dto = {
          id: msg.id,
          roomId: msg.roomId,
          user: msg.user
            ? { id: msg.user.id, displayName: msg.user.displayName }
            : undefined,
          type: msg.type as any,
          body: msg.body,
          createdAt: msg.createdAt.toISOString(),
        }
        io.to(`room:${roomId}`).emit('chat:message', { message: dto })
        ack?.({ ok: true, message: dto })
      } catch {
        ack?.({ ok: false, error: 'Failed to send message' })
      }
    })
  })

  // Attach io to fastify so handlers can emit events
  ;(server as any).io = io

  return io
}
