import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { LiveKitService } from '../services/LiveKitService'
import { db } from '@streamyolo/db'

const LK_URL = process.env.LIVEKIT_URL ?? ''
const LK_KEY = process.env.LIVEKIT_API_KEY ?? ''
const LK_SECRET = process.env.LIVEKIT_API_SECRET ?? ''

const TEST_USER_ID = '00000000-0000-0000-0000-0000live0001'
const testRoomName = `streamyolo-live-test-${Date.now()}`

describe.skipIf(!LK_URL || !LK_KEY || !LK_SECRET)(
  'LiveKit Integration (requires real credentials)',
  () => {
    const lk = new LiveKitService()
    let dbRoomId: string

    beforeAll(async () => {
      await db.user.upsert({
        where: { id: TEST_USER_ID },
        create: {
          id: TEST_USER_ID,
          email: 'lktest@test.local',
          passwordHash: 'x',
          username: 'lktest',
          displayName: 'LK Test',
        },
        update: {},
      })
      const creator = await db.creatorProfile.upsert({
        where: { userId: TEST_USER_ID },
        create: { userId: TEST_USER_ID, status: 'ACTIVE' },
        update: {},
      })
      const room = await db.room.create({
        data: {
          creatorId: creator.id,
          title: 'LiveKit Test Room',
          slug: `lk-test-${Date.now()}`,
          livekitRoomName: testRoomName,
          category: 'FEMALE',
          countryCode: 'US',
        },
      })
      dbRoomId = room.id
    })

    afterAll(async () => {
      await db.room.deleteMany({ where: { livekitRoomName: testRoomName } })
      await db.creatorProfile.deleteMany({ where: { userId: TEST_USER_ID } })
      await db.user.deleteMany({ where: { id: TEST_USER_ID } })
    })

    // Single sequential test — global afterEach would delete DB rows between
    // separate it() blocks, which would make getToken fail with "Room not found"
    it('creates a room, generates a valid JWT, and deletes the room', async () => {
      await lk.createRoom(testRoomName)

      const result = await lk.getToken(TEST_USER_ID, {
        appRoomType: 'PUBLIC_ROOM',
        appRoomId: dbRoomId,
      })
      expect(result.livekitUrl).toBe(LK_URL)
      // JWT: three base64url segments separated by dots
      expect(result.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/)
      expect(result.roomName).toBe(testRoomName)

      await lk.deleteRoom(testRoomName)
    })
  },
)
