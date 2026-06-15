import { describe, it, expect } from 'vitest'
import { buildTestApp, validateResponse, testOtherUserId, createActiveCreator, createLiveRoom } from './helpers'
import { db } from '@streamyolo/db'

const app = buildTestApp()

describe('listRooms', () => {
  it('GET /rooms', async () => {
    await createActiveCreator(testOtherUserId)
    await createLiveRoom(testOtherUserId)
    const res = await app.inject({
      method: 'GET',
      url: '/rooms',
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listRooms', 200, res.json())
  })
})

describe('getRoom', () => {
  it('GET /rooms/{slug}', async () => {
    await createActiveCreator(testOtherUserId)
    const room = await createLiveRoom(testOtherUserId)
    
    const res = await app.inject({
      method: 'GET',
      url: `/rooms/${room.slug}`,
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getRoom', 200, res.json())
  })
})
