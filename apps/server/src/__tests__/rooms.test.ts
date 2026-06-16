import { describe, it, expect, beforeAll } from 'vitest'
import { buildTestApp, validateResponse, testOtherUserId, createActiveCreator, createLiveRoom } from './helpers'
import { db } from '@streamyolo/db'

const app = buildTestApp()

async function seedBrowseTags() {
  await db.roomTag.upsert({
    where: { slug: 'gaming' },
    update: { label: 'Gaming', group: 'activity', isActive: true },
    create: { slug: 'gaming', label: 'Gaming', group: 'activity', sortOrder: 1 },
  })
}

describe('getRoomTaxonomy', () => {
  it('GET /rooms/taxonomy', async () => {
    await seedBrowseTags()
    const res = await app.inject({ method: 'GET', url: '/rooms/taxonomy' })
    expect(res.statusCode).toBe(200)
    await validateResponse('getRoomTaxonomy', 200, res.json())
  })
})

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

  it('filters by category and country', async () => {
    await seedBrowseTags()
    const creator = await createActiveCreator(testOtherUserId)
    const media = await db.mediaAsset.create({
      data: {
        owner: { connect: { id: creator.userId } },
        type: 'ROOM_THUMBNAIL_CAPTURE',
        url: 'http://example.com/thumb.jpg',
        status: 'APPROVED'
      }
    })
    await db.room.create({
      data: {
        creatorId: creator.id,
        title: 'Filtered Room',
        livekitRoomName: `lk-filtered-${Date.now()}`,
        status: 'LIVE',
        visibility: 'PUBLIC',
        thumbnailMediaId: media.id,
        category: 'FEMALE',
        countryCode: 'US',
      },
    })

    const res = await app.inject({
      method: 'GET',
      url: '/rooms?category=FEMALE&country=US',
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.length).toBeGreaterThan(0)
    expect(body.data.every((room: { category: string }) => room.category === 'FEMALE')).toBe(true)
  })

  it('filters by tag', async () => {
    await seedBrowseTags()
    const tag = await db.roomTag.findUniqueOrThrow({ where: { slug: 'gaming' } })
    const creator = await createActiveCreator(testOtherUserId)
    const media = await db.mediaAsset.create({
      data: {
        owner: { connect: { id: creator.userId } },
        type: 'ROOM_THUMBNAIL_CAPTURE',
        url: 'http://example.com/thumb.jpg',
        status: 'APPROVED'
      }
    })
    const room = await db.room.create({
      data: {
        creatorId: creator.id,
        title: 'Tagged Room',
        livekitRoomName: `lk-tagged-${Date.now()}`,
        status: 'LIVE',
        visibility: 'PUBLIC',
        thumbnailMediaId: media.id,
        category: 'COUPLES',
        countryCode: 'GB',
        tags: { create: [{ tagId: tag.id }] },
      },
    })

    const res = await app.inject({
      method: 'GET',
      url: '/rooms?tag=gaming',
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.some((item: { id: string }) => item.id === room.id)).toBe(true)
  })
})

describe('getUserChannel', () => {
  it('GET /users/{username}', async () => {
    await createActiveCreator(testOtherUserId)
    const room = await createLiveRoom(testOtherUserId)
    const user = await db.user.findUnique({ where: { id: testOtherUserId } })

    const res = await app.inject({
      method: 'GET',
      url: `/users/${user!.username}`,
    })
    console.log(res.body)
    expect(res.statusCode).toBe(200)
    await validateResponse('getUserChannel', 200, res.json())
  })
})
