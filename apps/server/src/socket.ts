import { Server as SocketIOServer } from 'socket.io'
import type { FastifyInstance } from 'fastify'
import type { ServerToClientEvents, ClientToServerEvents } from '@streamyolo/shared'
import { db } from '@streamyolo/db'
import { ModerationService } from './services/ModerationService'
import { RoomService } from './services/RoomService'

const moderationService = new ModerationService()
const roomService = new RoomService()

const creatorDisconnectTimers = new Map<string, NodeJS.Timeout>()

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
    socket.join(`user:${socket.data.userId}`)

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
          select: { viewerCount: true, creatorId: true },
        })

        // Check if user is the creator and clear disconnect timer
        const creator = await db.creatorProfile.findUnique({ where: { userId } })
        if (creator && creator.id === room.creatorId) {
          const timer = creatorDisconnectTimers.get(roomId)
          if (timer) {
            clearTimeout(timer)
            creatorDisconnectTimers.delete(roomId)
            io.to(`room:${roomId}`).emit('room:reconnected', { roomId })
          }
        }

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
        
        try {
          const userId = socket.data.userId
          const creator = await db.creatorProfile.findUnique({ where: { userId } })
          if (creator) {
            const room = await db.room.findFirst({
              where: { id: roomId, creatorId: creator.id, status: 'LIVE' },
            })
            if (room) {
              io.to(`room:${roomId}`).emit('room:reconnecting', { roomId })
              const timer = setTimeout(async () => {
                try {
                  const current = await db.room.findFirst({
                    where: { id: roomId, status: 'LIVE' },
                  })
                  if (current) {
                    await roomService.endRoom(userId, roomId)
                    io.to(`room:${roomId}`).emit('room:ended', { roomId })
                  }
                } catch (e) {
                  console.error('[Socket] Failed to end room on timeout', e)
                } finally {
                  creatorDisconnectTimers.delete(roomId)
                }
              }, 45000)
              creatorDisconnectTimers.set(roomId, timer)
            }
          }
        } catch (e) {
          // ignore
        }
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
