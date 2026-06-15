// Generated from openapi.yaml — fill in seeds and assertions.
// Run `pnpm test:generate` to add stubs for new routes.
// Both test users are pre-seeded: use testOtherUserId for cross-user permission tests.
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId } from './helpers'

const app = buildTestApp()

describe('getRoomMenu', () => {
  it('GET /rooms/{roomId}/menu', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/rooms/00000000-0000-0000-0000-000000000001/menu',
      // payload: {},
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
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/rooms/00000000-0000-0000-0000-000000000001/tips',
      headers: asAuth(testUserId),
      // payload: {},
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
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/creator/tips/00000000-0000-0000-0000-000000000001/acknowledge',
      headers: asAuth(testUserId),
      // payload: {},
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
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/creator/tips/00000000-0000-0000-0000-000000000001/complete',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('completeTip', 200, res.json())
  })
})
