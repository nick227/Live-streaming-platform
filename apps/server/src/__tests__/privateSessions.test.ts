import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '@streamyolo/db'
import { PrivateSessionService } from '../services/PrivateSessionService'
import { nanoid } from 'nanoid'

describe('Private Sessions Settlement Math', () => {
  let viewer: any
  let creator: any
  let creatorProfile: any
  let room: any
  let viewerWallet: any
  let sessionService: PrivateSessionService

  beforeEach(async () => {
    sessionService = new PrivateSessionService()
    
    // Seed fixtures
    viewer = await db.user.create({
      data: {
        id: nanoid(),
        email: `${nanoid()}@test.com`,
        username: nanoid(),
        displayName: 'Viewer',
        passwordHash: 'dummy',
      },
    })
    creator = await db.user.create({
      data: {
        id: nanoid(),
        email: `${nanoid()}@test.com`,
        username: nanoid(),
        displayName: 'Creator',
        passwordHash: 'dummy',
      },
    })
    creatorProfile = await db.creatorProfile.create({
      data: {
        id: nanoid(),
        userId: creator.id,
        status: 'ACTIVE',
        privateRateTokensPerMinute: 10,
        minPrivateMinutes: 1,
      },
    })
    room = await db.room.create({
      data: {
        id: nanoid(),
        creatorId: creatorProfile.id,
        status: 'LIVE',
        title: 'Test Room',
        thumbnailMediaId: 'dummy',
        slug: nanoid(),
        livekitRoomName: nanoid(),
      },
    })
    viewerWallet = await db.wallet.create({
      data: {
        userId: viewer.id,
        tokenBalance: 100, // Affordable max is 10 mins (100 / 10)
      },
    })
  })

  afterEach(async () => {
    await db.ledgerEntry.deleteMany()
    await db.wallet.deleteMany()
    await db.privateSession.deleteMany()
    await db.room.deleteMany()
    await db.creatorProfile.deleteMany()
    await db.user.deleteMany()
  })

  async function createSessionAndStart(balance: number = 100) {
    await db.wallet.update({ where: { userId: viewer.id }, data: { tokenBalance: balance } })
    const { privateSession: requested } = await sessionService.request(viewer.id, room.id)
    await sessionService.accept(creator.id, requested.id)
    const { privateSession: started } = await sessionService.start(creator.id, requested.id)
    return started
  }

  it('reserves up to 30 mins based on balance', async () => {
    // Viewer has 100 tokens, rate is 10 -> reserves 100
    const started = await createSessionAndStart(100)
    expect(started.reservedTokens).toBe(100)

    const wallet = await db.wallet.findUnique({ where: { userId: viewer.id } })
    expect(wallet?.tokenBalance).toBe(0)
    expect(wallet?.reservedTokenBalance).toBe(100)
    
    const hardEndAt = new Date(started.hardEndAt)
    const startedAt = new Date(started.startedAt)
    const diffMins = (hardEndAt.getTime() - startedAt.getTime()) / 60000
    expect(diffMins).toBe(10) // 10 minutes reserved
  })

  it('end at 30 seconds rounds to 1 minute', async () => {
    const started = await createSessionAndStart(100)
    
    // Fast forward 30 seconds
    await db.privateSession.update({
      where: { id: started.id },
      data: { startedAt: new Date(Date.now() - 30 * 1000) }
    })

    const { privateSession, wallet } = await sessionService.end(viewer.id, started.id)
    expect(privateSession.capturedTokens).toBe(10) // 1 minute * 10
    expect(privateSession.releasedTokens).toBe(90) // 100 - 10
    
    expect(wallet.tokenBalance).toBe(90) // 0 + 90 released
    expect(wallet.reservedTokenBalance).toBe(0)
  })

  it('end at 61 seconds rounds to 2 minutes', async () => {
    const started = await createSessionAndStart(100)
    
    // Fast forward 61 seconds
    await db.privateSession.update({
      where: { id: started.id },
      data: { startedAt: new Date(Date.now() - 61 * 1000) }
    })

    const { privateSession, wallet } = await sessionService.end(viewer.id, started.id)
    expect(privateSession.capturedTokens).toBe(20) // 2 minutes * 10
    expect(privateSession.releasedTokens).toBe(80) // 100 - 20
    
    expect(wallet.tokenBalance).toBe(80)
  })

  it('end past hardEndAt caps at hardEndAt and releases unused reserve (0)', async () => {
    const started = await createSessionAndStart(50) // 5 mins reserved
    
    // Fast forward 10 minutes (past hardEndAt)
    await db.privateSession.update({
      where: { id: started.id },
      data: { startedAt: new Date(Date.now() - 10 * 60 * 1000), hardEndAt: new Date(Date.now() - 5 * 60 * 1000) }
    })

    const { privateSession, wallet } = await sessionService.end(viewer.id, started.id)
    expect(privateSession.capturedTokens).toBe(50) // capped at reservedTokens
    expect(privateSession.releasedTokens).toBe(0)
    
    expect(wallet.tokenBalance).toBe(0)
  })

  it('duplicate end is idempotent', async () => {
    const started = await createSessionAndStart(100)
    const first = await sessionService.end(viewer.id, started.id)
    
    // Count ledger entries
    const countAfterFirst = await db.ledgerEntry.count()

    const second = await sessionService.end(viewer.id, started.id)
    const countAfterSecond = await db.ledgerEntry.count()

    expect(second.privateSession.id).toBe(first.privateSession.id)
    expect(second.privateSession.status).toBe('ENDED')
    expect(countAfterSecond).toBe(countAfterFirst)
  })

  it('expireStaleActive settles expired sessions', async () => {
    const started = await createSessionAndStart(50) // 5 mins max
    
    // Fast forward hardEndAt to 2 mins ago
    await db.privateSession.update({
      where: { id: started.id },
      data: { hardEndAt: new Date(Date.now() - 2 * 60 * 1000) }
    })

    await PrivateSessionService.expireStaleActive()

    const settled = await db.privateSession.findUnique({ where: { id: started.id } })
    expect(settled?.status).toBe('FORCE_ENDED')
    expect(settled?.capturedTokens).toBe(50)
    expect(settled?.releasedTokens).toBe(0)

    const creatorWallet = await db.wallet.findUnique({ where: { userId: creator.id } })
    expect(creatorWallet?.tokenBalance).toBe(50) // Creator earned the fully captured tokens
  })
})
