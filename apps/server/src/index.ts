import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import openapiGlue from 'fastify-openapi-glue'
import { load } from 'js-yaml'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@streamyolo/shared'
import { db } from '@streamyolo/db'
import * as handlers from './handlers'
import * as security from './plugins/security'
import { PrivateSessionService } from './services/PrivateSessionService'

const server = Fastify({ logger: true })

const specPath = resolve(__dirname, '../../../packages/api-spec/openapi.yaml')
const spec = load(readFileSync(specPath, 'utf-8')) as object

async function main() {
  await server.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  })

  await server.register(cookie)
  await server.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } })

  await server.register(swagger, { openapi: spec })
  await server.register(swaggerUi, { routePrefix: '/docs' })

  server.setErrorHandler((error, _request, reply) => {
    if (error.validation) {
      return reply.status(400).send({ error: 'Validation failed', details: error.validation })
    }
    if (error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    if ((error as any).code === 'P2025') {
      return reply.status(404).send({ error: 'Not found' })
    }
    if ((error as any).code === 'P2002') {
      return reply.status(409).send({ error: 'Already exists' })
    }
    server.log.error(error)
    return reply.status(500).send({ error: 'Internal server error' })
  })

  await server.register(openapiGlue, {
    specification: specPath,
    service: handlers,
    securityHandlers: security,
    noAdditional: true,
  } as any)

  server.get('/health', async () => ({ status: 'ok' }))

  // Build HTTP server and attach Socket.IO
  const httpServer = createServer(server.server)
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
      credentials: true,
    },
  })

  // Verify session token on every socket connection
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined
    if (!token) return next(new Error('Unauthorized'))
    try {
      const session = await db.session.findUnique({
        where: { token },
        include: { user: true },
      })
      if (!session || session.expiresAt < new Date()) return next(new Error('Unauthorized'))
      if (session.user.suspendedAt) return next(new Error('Account suspended'))
      ;(socket as any).userId = session.user.id
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  // Expire stale REQUESTED private sessions every minute
  setInterval(() => {
    PrivateSessionService.expireStaleRequested().catch((err) => server.log.error(err))
  }, 60_000)

  // Track room membership for viewer count
  io.on('connection', (socket) => {
    socket.on('room:join', async ({ roomId }, ack) => {
      try {
        socket.join(`room:${roomId}`)
        const room = await db.room.findUnique({ where: { id: roomId }, select: { viewerCount: true } })
        ack?.({ ok: true })
        io.to(`room:${roomId}`).emit('room:viewer_count', {
          roomId,
          viewerCount: (room?.viewerCount ?? 0) + 1,
        })
      } catch {
        ack?.({ ok: false, error: 'Failed to join room' })
      }
    })

    socket.on('room:leave', ({ roomId }) => {
      socket.leave(`room:${roomId}`)
    })

    socket.on('chat:send', async ({ roomId, body }, ack) => {
      // Chat messages go through the REST tip handler and are broadcast there.
      // This socket event is a real-time shortcut for simple chat — no token deduction.
      try {
        const msg = await db.chatMessage.create({
          data: {
            roomId,
            type: 'USER_MESSAGE',
            body,
          },
          include: { user: { select: { id: true, username: true, displayName: true } } },
        })
        const dto = {
          id: msg.id,
          roomId: msg.roomId,
          user: msg.user
            ? { id: msg.user.id, username: msg.user.username, displayName: msg.user.displayName ?? undefined }
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

  await server.ready()

  const port = Number(process.env.PORT ?? 3001)
  httpServer.listen(port, '0.0.0.0', () => {
    server.log.info(`Server listening on port ${port}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
