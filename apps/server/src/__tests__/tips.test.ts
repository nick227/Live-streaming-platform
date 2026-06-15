import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId, createTestCreator, createLiveRoom, createTip, createWallet } from './helpers'
import { db } from '@streamyolo/db'

const app = buildTestApp()

describe('getRoomMenu', () => {
  it('GET /rooms/{roomId}/menu', async () => {
    const creator = await createTestCreator(testOtherUserId)
    const room = await createLiveRoom(creator.id)
    await db.creatorMenuItem.create({
      data: { creatorId: creator.id, label: 'Shoutout', tokenAmount: 50, isActive: true }
    })
    
    const res = await app.inject({
      method: 'GET',
      url: `/rooms/${room.id}/menu`,
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getRoomMenu', 200, res.json())
  })
})

describe('createTip', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/rooms/00000000-0000-0000-0000-000000000001/tips' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /rooms/{roomId}/tips', async () => {
    const creator = await createTestCreator(testOtherUserId)
    const room = await createLiveRoom(creator.id)
    await createWallet(testUserId, 1000)

    const res = await app.inject({
      method: 'POST',
      url: `/rooms/${room.id}/tips`,
      headers: asAuth(testUserId),
      payload: { amountTokens: 50, requestType: 'GENERAL', requestText: 'Great job!' },
    })
    expect(res.statusCode).toBe(201)
    await validateResponse('createTip', 201, res.json())
  })
})

describe('acknowledgeTip', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/creator/tips/00000000-0000-0000-0000-000000000001/acknowledge' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /creator/tips/{tipId}/acknowledge', async () => {
    const creator = await createTestCreator(testUserId)
    const room = await createLiveRoom(creator.id)
    const tip = await db.tip.create({
      data: { roomId: room.id, fromUserId: testOtherUserId, toCreatorId: creator.id, amountTokens: 50, status: 'SENT', requestType: 'GENERAL' }
    })

    const res = await app.inject({
      method: 'POST',
      url: `/creator/tips/${tip.id}/acknowledge`,
      headers: asAuth(testUserId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('acknowledgeTip', 200, res.json())
  })
})

describe('completeTip', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/creator/tips/00000000-0000-0000-0000-000000000001/complete' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /creator/tips/{tipId}/complete', async () => {
    const creator = await createTestCreator(testUserId)
    const room = await createLiveRoom(creator.id)
    const tip = await db.tip.create({
      data: { roomId: room.id, fromUserId: testOtherUserId, toCreatorId: creator.id, amountTokens: 50, status: 'SENT', requestType: 'GENERAL' }
    })

    const res = await app.inject({
      method: 'POST',
      url: `/creator/tips/${tip.id}/complete`,
      headers: asAuth(testUserId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('completeTip', 200, res.json())
  })
})
