import './lib/env'
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
import { Server as SocketIOServer } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@streamyolo/shared'
import { db } from '@streamyolo/db'
import * as handlers from './handlers'
import * as security from './plugins/security'
import { PrivateSessionService } from './services/PrivateSessionService'
import { attachSocketIO } from './socket'

if (!process.env.DATABASE_URL) {
  console.error('[startup] DATABASE_URL is not set. Add it to your .env file:\n  DATABASE_URL=mysql://root:@localhost:3306/streamyolo_dev')
  process.exit(1)
}

const server = Fastify({ logger: true })

const specPath = resolve(__dirname, '../../../packages/api-spec/openapi.yaml')
const spec = load(readFileSync(specPath, 'utf-8')) as object

async function resetStaleLiveRooms() {
  const staleCount = await db.room.count({ where: { status: 'LIVE' } })
  if (staleCount > 0) {
    console.log(`[startup] Resetting ${staleCount} stale LIVE room(s) from previous process`)
    await db.room.updateMany({ where: { status: 'LIVE' }, data: { status: 'ENDED', endedAt: new Date() } })
    await db.creatorProfile.updateMany({ where: { isLive: true }, data: { isLive: false, currentRoomId: null } })
  }
  await PrivateSessionService.cleanupStaleSessionsOnStartup()
}

async function main() {
  await resetStaleLiveRooms()

  await server.register(cors, {
    origin: process.env.NODE_ENV === 'production' ? process.env.CORS_ORIGIN : true,
    credentials: true,
  })

  await server.register(cookie)
  await server.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } })

  await server.register(swagger, { openapi: spec })
  await server.register(swaggerUi, { routePrefix: '/docs' })

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fastifyStatic = require('@fastify/static')
  await server.register(fastifyStatic, {
    root: resolve(__dirname, '../../../uploads'),
    prefix: '/uploads/',
  })

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
    serviceHandlers: handlers,
    securityHandlers: security,
    noAdditional: true,
  } as any)

  server.get('/health', async () => ({ status: 'ok' }))

  // Build HTTP server and attach Socket.IO
  attachSocketIO(server)

  await server.ready()

  // Start sweep jobs
  setInterval(() => {
    PrivateSessionService.expireStaleRequested().catch(console.error)
    PrivateSessionService.expireStaleActive().catch(console.error)
  }, 60 * 1000)

  // 10s precision loop for creator disconnects
  setInterval(() => {
    PrivateSessionService.checkCreatorDisconnects().catch(console.error)
  }, 10 * 1000)

  const port = Number(process.env.PORT ?? 3001)
  server.listen({ port, host: '0.0.0.0' }, (err) => {
    if (err) {
      server.log.error(err)
      process.exit(1)
    }
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
