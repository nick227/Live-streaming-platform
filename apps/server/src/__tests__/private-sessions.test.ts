import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId, createActiveCreator, createLiveRoom, createWallet, createPrivateSession } from './helpers'
import { db } from '@streamyolo/db'

const app = buildTestApp()

describe('requestPrivateSession', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/rooms/00000000-0000-0000-0000-000000000001/private-sessions/request' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /rooms/{roomId}/private-sessions/request', async () => {
    await createActiveCreator(testOtherUserId)
    const room = await createLiveRoom(testOtherUserId)
    await createWallet(testUserId, 1000)

    const res = await app.inject({
      method: 'POST',
      url: `/rooms/${room.id}/private-sessions/request`,
      headers: asAuth(testUserId),
    })
    expect(res.statusCode).toBe(201)
    await validateResponse('requestPrivateSession', 201, res.json())
  })
})

describe('acceptPrivateSession', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/creator/private-sessions/00000000-0000-0000-0000-000000000001/accept' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /creator/private-sessions/{sessionId}/accept', async () => {
    await createActiveCreator(testUserId)
    const room = await createLiveRoom(testUserId)
    await createWallet(testOtherUserId, 1000)
    const session = await createPrivateSession(room.id, testOtherUserId)

    const res = await app.inject({
      method: 'POST',
      url: `/creator/private-sessions/${session.id}/accept`,
      headers: asAuth(testUserId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('acceptPrivateSession', 200, res.json())
  })
})

describe('declinePrivateSession', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/creator/private-sessions/00000000-0000-0000-0000-000000000001/decline' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /creator/private-sessions/{sessionId}/decline', async () => {
    await createActiveCreator(testUserId)
    const room = await createLiveRoom(testUserId)
    const session = await createPrivateSession(room.id, testOtherUserId)

    const res = await app.inject({
      method: 'POST',
      url: `/creator/private-sessions/${session.id}/decline`,
      headers: asAuth(testUserId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('declinePrivateSession', 200, res.json())
  })
})

describe('startPrivateSession', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/private-sessions/00000000-0000-0000-0000-000000000001/start' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /private-sessions/{sessionId}/start', async () => {
    await createActiveCreator(testOtherUserId)
    const room = await createLiveRoom(testOtherUserId)
    const session = await createPrivateSession(room.id, testUserId)
    await db.privateSession.update({ where: { id: session.id }, data: { status: 'ACCEPTED' } })

    const res = await app.inject({
      method: 'POST',
      url: `/private-sessions/${session.id}/start`,
      headers: asAuth(testOtherUserId), // Creator starts it
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('startPrivateSession', 200, res.json())
  })
})

describe('endPrivateSession', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/private-sessions/00000000-0000-0000-0000-000000000001/end' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /private-sessions/{sessionId}/end', async () => {
    await createActiveCreator(testOtherUserId)
    const room = await createLiveRoom(testOtherUserId)
    const session = await createPrivateSession(room.id, testUserId)
    await db.privateSession.update({ where: { id: session.id }, data: { status: 'ACTIVE', startedAt: new Date() } })

    const res = await app.inject({
      method: 'POST',
      url: `/private-sessions/${session.id}/end`,
      headers: asAuth(testOtherUserId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('endPrivateSession', 200, res.json())
  })
})
