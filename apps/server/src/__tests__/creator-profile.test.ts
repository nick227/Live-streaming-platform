// Generated from openapi.yaml — fill in seeds and assertions.
// Run `pnpm test:generate` to add stubs for new routes.
// Both test users are pre-seeded: use testOtherUserId for cross-user permission tests.
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId } from './helpers'

const app = buildTestApp()

describe('getCreatorProfile', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/creator/profile' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /creator/profile', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/creator/profile',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getCreatorProfile', 200, res.json())
  })
})

describe('updateCreatorProfile', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'PATCH', url: '/creator/profile' })
    expect(res.statusCode).toBe(401)
  })

  it('PATCH /creator/profile', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'PATCH',
      url: '/creator/profile',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('updateCreatorProfile', 200, res.json())
  })
})
