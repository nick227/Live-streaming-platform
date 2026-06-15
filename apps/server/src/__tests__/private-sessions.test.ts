// Generated from openapi.yaml — fill in seeds and assertions.
// Run `pnpm test:generate` to add stubs for new routes.
// Both test users are pre-seeded: use testOtherUserId for cross-user permission tests.
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId } from './helpers'

const app = buildTestApp()

describe('requestPrivateSession', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/rooms/00000000-0000-0000-0000-000000000001/private-sessions/request' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /rooms/{roomId}/private-sessions/request', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/rooms/00000000-0000-0000-0000-000000000001/private-sessions/request',
      headers: asAuth(testUserId),
      // payload: {},
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
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/creator/private-sessions/00000000-0000-0000-0000-000000000001/accept',
      headers: asAuth(testUserId),
      // payload: {},
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
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/creator/private-sessions/00000000-0000-0000-0000-000000000001/decline',
      headers: asAuth(testUserId),
      // payload: {},
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
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/private-sessions/00000000-0000-0000-0000-000000000001/start',
      headers: asAuth(testUserId),
      // payload: {},
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
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/private-sessions/00000000-0000-0000-0000-000000000001/end',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('endPrivateSession', 200, res.json())
  })
})
