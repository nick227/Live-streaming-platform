import { describe, it, expect } from 'vitest'
import { buildTestApp, validateResponse, testOtherUserId, createTestCreator, createRoom } from './helpers'

const app = buildTestApp()

describe('getRoomMessages', () => {
  it('GET /rooms/{roomId}/messages', async () => {
    await createTestCreator(testOtherUserId)
    const room = await createRoom(testOtherUserId)
    const res = await app.inject({
      method: 'GET',
      url: `/rooms/${room.id}/messages`,
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getRoomMessages', 200, res.json())
  })
})
