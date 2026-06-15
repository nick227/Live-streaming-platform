// Generated from openapi.yaml — fill in seeds and assertions.
// Run `pnpm test:generate` to add stubs for new routes.
// Both test users are pre-seeded: use testOtherUserId for cross-user permission tests.
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId } from './helpers'

const app = buildTestApp()

describe('listRooms', () => {
  it('GET /rooms', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/rooms',
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listRooms', 200, res.json())
  })
})

describe('getRoom', () => {
  it('GET /rooms/{slug}', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/rooms/00000000-0000-0000-0000-000000000001',
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getRoom', 200, res.json())
  })
})
