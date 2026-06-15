// Generated from openapi.yaml — fill in seeds and assertions.
// Run `pnpm test:generate` to add stubs for new routes.
// Both test users are pre-seeded: use testOtherUserId for cross-user permission tests.
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId } from './helpers'

const app = buildTestApp()

describe('getRoomMessages', () => {
  it('GET /rooms/{roomId}/messages', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/rooms/00000000-0000-0000-0000-000000000001/messages',
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getRoomMessages', 200, res.json())
  })
})
