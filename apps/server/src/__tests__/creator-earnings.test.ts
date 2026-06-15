// Generated from openapi.yaml — fill in seeds and assertions.
// Run `pnpm test:generate` to add stubs for new routes.
// Both test users are pre-seeded: use testOtherUserId for cross-user permission tests.
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId } from './helpers'

const app = buildTestApp()

describe('getCreatorEarnings', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/creator/earnings' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /creator/earnings', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/creator/earnings',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getCreatorEarnings', 200, res.json())
  })
})
