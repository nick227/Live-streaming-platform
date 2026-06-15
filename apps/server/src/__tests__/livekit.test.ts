import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, createRoom, createTestCreator } from './helpers'

const app = buildTestApp()

describe('getLivekitToken', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/livekit/token' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /livekit/token', async () => {
    await createTestCreator(testUserId)
    const room = await createRoom(testUserId)
    
    // In CI/test without env vars, this will return 503 instead of 200.
    // If it returns 503 due to missing LIVEKIT_URL, we treat it as passing.
    const res = await app.inject({
      method: 'POST',
      url: '/livekit/token',
      headers: asAuth(testUserId),
      payload: { appRoomType: 'PUBLIC_ROOM', appRoomId: room.id },
    })
    
    if (res.statusCode === 503) {
      // LiveKit not configured
      expect(res.json().message).toMatch(/LiveKit is not configured/)
    } else {
      expect(res.statusCode).toBe(200)
      await validateResponse('getLivekitToken', 200, res.json())
    }
  })
})
