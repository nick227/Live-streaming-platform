// Generated from openapi.yaml — fill in seeds and assertions.
// Run `pnpm test:generate` to add stubs for new routes.
// Both test users are pre-seeded: use testOtherUserId for cross-user permission tests.
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId } from './helpers'

const app = buildTestApp()

describe('uploadMedia', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/media/upload' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /media/upload', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/media/upload',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(201)
    await validateResponse('uploadMedia', 201, res.json())
  })
})

describe('captureRoomThumbnail', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/rooms/00000000-0000-0000-0000-000000000001/thumbnail/capture' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /rooms/{roomId}/thumbnail/capture', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/rooms/00000000-0000-0000-0000-000000000001/thumbnail/capture',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('captureRoomThumbnail', 200, res.json())
  })
})
