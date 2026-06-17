import { httpError } from '../../lib/errors'
import '../../lib/env'
import { beforeAll, beforeEach, afterAll } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import openapiGlue from 'fastify-openapi-glue'
import SwaggerParser from '@apidevtools/swagger-parser'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { resolve } from 'path'
import { db } from '@streamyolo/db'
import * as handlers from '../../handlers'

export const testUserId      = '00000000-0000-0000-0000-000000000001'
export const testOtherUserId = '00000000-0000-0000-0000-000000000002'
export const testAdminId     = '00000000-0000-0000-0000-admin0000000'

const specPath = resolve(__dirname, '../../../../../packages/api-spec/openapi.yaml')

let derefSpec: any
async function getSpec() {
  if (!derefSpec) derefSpec = await SwaggerParser.dereference(specPath)
  return derefSpec
}

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

async function seedTestUsers() {
  await cleanupTestData()
  await db.user.createMany({
    data: [
      {
        id: testUserId,
        email: 'alice@test.local',
        passwordHash: 'x',
        username: 'alice',
        displayName: 'Alice',
      },
      {
        id: testOtherUserId,
        email: 'bob@test.local',
        passwordHash: 'x',
        username: 'bob',
        displayName: 'Bob',
      },
      {
        id: testAdminId,
        email: 'admin@test.local',
        passwordHash: 'x',
        username: 'admin',
        displayName: 'Admin',
        role: 'ADMIN',
      },
    ],
    skipDuplicates: true,
  })
}

async function cleanupTestData() {
  await db.ledgerEntry.deleteMany()
  await db.roomModerationAction.deleteMany()
  await db.creatorUserReward.deleteMany()
  await db.creatorUserBan.deleteMany()
  await db.roomChatSettings.deleteMany()
  await db.adminAction.deleteMany()
  await db.report.deleteMany()
  await db.tip.deleteMany()
  await db.privateSession.deleteMany()
  await db.roomMenuItem.deleteMany()
  await db.roomGoal.deleteMany()
  await db.chatMessage.deleteMany()
  await db.roomTagAssignment.deleteMany()
  await db.creatorDefaultRoomTag.deleteMany()
  await db.room.deleteMany()
  await db.creatorMenuItem.deleteMany()
  await db.creatorProfile.deleteMany()
  await db.mediaAsset.deleteMany()
  await db.paymentTransaction.deleteMany()
  await db.tokenPack.deleteMany()
  await db.wallet.deleteMany()
  await db.session.deleteMany()
  await db.user.deleteMany({
    where: {
      id: {
        notIn: [
          testUserId,
          testOtherUserId,
          testAdminId,
        ],
      },
    },
  })
}

import { attachSocketIO } from '../../socket'

export function buildTestApp() {
  const app: FastifyInstance = Fastify()

  beforeAll(async () => {
    await app.register(cookie, {
      secret: process.env.COOKIE_SECRET ?? 'test-cookie-secret-at-least-32-characters',
    })
    await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } })
    await app.register(openapiGlue, {
      specification: specPath,
      serviceHandlers: handlers,
      securityHandlers: {
        async bearerAuth(request: any) {
          const id = request.headers.authorization?.replace('Bearer ', '')
          if (!id) throw httpError(401, 'Unauthorized')
          request.user = await db.user.findUniqueOrThrow({ where: { id } })
        },
        async adminAuth(request: any) {
          const id = request.headers.authorization?.replace('Bearer ', '')
          if (!id) throw httpError(401, 'Unauthorized')
          request.user = await db.user.findUniqueOrThrow({ where: { id } })
          if (request.user.role !== 'ADMIN') throw httpError(403, 'Forbidden')
        },
      },
      noAdditional: true,
    } as any)
    attachSocketIO(app)
    await app.ready()
  })

  beforeEach(async () => {
    await seedTestUsers()
  })

  afterAll(() => app.close())

  return app
}

export function asAuth(userId: string) {
  return { Authorization: `Bearer ${userId}` }
}

export async function validateResponse(operationId: string, status: number, body: unknown) {
  const spec = await getSpec()
  for (const pathItem of Object.values<any>(spec.paths ?? {})) {
    for (const op of Object.values<any>(pathItem)) {
      if (op.operationId !== operationId) continue
      const schema = op.responses?.[status]?.content?.['application/json']?.schema
      if (!schema) return
      const validate = ajv.compile(schema)
      if (!validate(body)) {
        throw new Error(
          `${operationId} ${status} response does not match spec:\n` +
          JSON.stringify(validate.errors, null, 2)
        )
      }
      return
    }
  }
}

// ── Reusable Seed Helpers ──────────────────────────────────────────────────

export async function createTestCreator(userId: string = testUserId) {
  return db.creatorProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      bio: 'Test bio',
      privateRulesText: 'No recording allowed.',
      privateRateTokensPerMinute: 10,
      minPrivateMinutes: 5,
      privateViewerCamMode: 'OPTIONAL',
      privateScreenShareAllowed: true,
      status: 'ACTIVE',
    },
  })
}

export async function createActiveCreator(userId: string = testUserId) {
  return db.creatorProfile.create({
    data: {
      userId,
      status: 'ACTIVE',
      privateRateTokensPerMinute: 10,
      privateRulesText: 'No rules',
    }
  })
}

export async function createRoom(creatorOrUserId: string) {
  let creator = await db.creatorProfile.findUnique({ where: { userId: creatorOrUserId } })
  if (!creator) creator = await db.creatorProfile.findUniqueOrThrow({ where: { id: creatorOrUserId } })
  return db.room.create({
    data: {
      creatorId: creator.id,
      title: 'Test Room',
      livekitRoomName: `lk-${Math.random()}`,
      category: 'MUSIC',
      countryCode: 'US',
    },
  })
}

export async function createLiveRoom(creatorOrUserId: string) {
  let creator = await db.creatorProfile.findUnique({ where: { userId: creatorOrUserId } })
  if (!creator) creator = await db.creatorProfile.findUniqueOrThrow({ where: { id: creatorOrUserId } })
  const media = await db.mediaAsset.create({
    data: {
      owner: { connect: { id: creator.userId } },
      type: 'ROOM_THUMBNAIL_CAPTURE',
      url: 'http://example.com/thumb.jpg',
      status: 'APPROVED'
    }
  })

  const room = await db.room.create({
    data: {
      creatorId: creator.id,
      title: 'Live Room',
      livekitRoomName: `lk-live-${Math.random()}`,
      status: 'LIVE',
      thumbnailMediaId: media.id,
      category: 'MUSIC',
      countryCode: 'US',
    }
  })

  await db.creatorProfile.update({
    where: { id: creator.id },
    data: {
      isLive: true,
      currentRoomId: room.id,
    }
  })

  return room
}

export async function createWallet(userId: string = testUserId, balance: number = 1000) {
  return db.wallet.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      tokenBalance: balance,
    },
  })
}

export async function createTip(roomId: string, userId: string = testUserId) {
  const room = await db.room.findUniqueOrThrow({ where: { id: roomId } })
  return db.tip.create({
    data: {
      roomId,
      fromUserId: userId,
      toCreatorId: room.creatorId,
      amountTokens: 50,
      requestText: 'Nice stream!',
      requestType: 'CUSTOM',
      status: 'COMPLETED'
    }
  })
}

export async function createPrivateSession(roomId: string, viewerId: string = testUserId) {
  const room = await db.room.findUniqueOrThrow({ where: { id: roomId } })
  const reservedTokens = 50
  await db.wallet.upsert({
    where: { userId: viewerId },
    update: {
      tokenBalance: { decrement: reservedTokens },
      reservedTokenBalance: { increment: reservedTokens },
    },
    create: {
      userId: viewerId,
      tokenBalance: 1000 - reservedTokens,
      reservedTokenBalance: reservedTokens,
    },
  })
  return db.privateSession.create({
    data: {
      publicRoomId: roomId,
      creatorId: room.creatorId,
      viewerId,
      status: 'REQUESTED',
      rateTokensPerMinute: 10,
      minMinutes: 5,
      reservedTokens,
    }
  })
}

export async function createMediaAsset(userId: string = testUserId) {
  return db.mediaAsset.create({
    data: {
      ownerUserId: userId,
      type: 'AVATAR',
      url: 'https://example.com/image.jpg',
      status: 'PENDING'
    }
  })
}

export async function createPayment(userId: string = testUserId) {
  const pack = await db.tokenPack.create({ data: { name: 'Test', priceCents: 1000, tokenAmount: 100 } })
  return db.paymentTransaction.create({
    data: {
      userId,
      tokenPackId: pack.id,
      provider: 'CCBILL',
      providerTxnId: `txn_${Date.now()}_${Math.random()}`,
      amountCents: 1000,
      status: 'APPROVED'
    }
  })
}

export async function createReport(targetUserId: string, reporterId: string = testUserId) {
  return db.report.create({
    data: {
      reporterId,
      targetType: 'USER',
      targetUserId,
      reason: 'INAPPROPRIATE',
      status: 'PENDING'
    }
  })
}
