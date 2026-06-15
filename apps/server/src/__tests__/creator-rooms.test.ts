// Generated from openapi.yaml — fill in seeds and assertions.
// Run `pnpm test:generate` to add stubs for new routes.
// Both test users are pre-seeded: use testOtherUserId for cross-user permission tests.
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId } from './helpers'

const app = buildTestApp()

describe('prepareRoom', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/creator/rooms/prepare' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /creator/rooms/prepare', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/creator/rooms/prepare',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('prepareRoom', 200, res.json())
  })
})

describe('goLive', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/creator/rooms/00000000-0000-0000-0000-000000000001/go-live' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /creator/rooms/{roomId}/go-live', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/creator/rooms/00000000-0000-0000-0000-000000000001/go-live',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('goLive', 200, res.json())
  })
})

describe('endRoom', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/creator/rooms/00000000-0000-0000-0000-000000000001/end' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /creator/rooms/{roomId}/end', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/creator/rooms/00000000-0000-0000-0000-000000000001/end',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('endRoom', 200, res.json())
  })
})
