import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, createTestCreator, createActiveCreator, createRoom, createMediaAsset } from './helpers'
import { db } from '@streamyolo/db'

const app = buildTestApp()

describe('prepareRoom', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/creator/rooms/prepare' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /creator/rooms/prepare', async () => {
    await createTestCreator(testUserId)
    await db.roomTag.upsert({
      where: { slug: 'gaming' },
      update: { label: 'Gaming', isActive: true },
      create: { slug: 'gaming', label: 'Gaming', group: 'activity', sortOrder: 1 },
    })
    const media = await createMediaAsset(testUserId)
    const res = await app.inject({
      method: 'POST',
      url: '/creator/rooms/prepare',
      headers: asAuth(testUserId),
      payload: {
        title: 'New Stream',
        thumbnailMediaId: media.id,
        category: 'FEMALE',
        countryCode: 'US',
        tagSlugs: ['gaming'],
      },
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
    const creator = await createActiveCreator(testUserId)
    await db.creatorMenuItem.create({
      data: { creatorId: creator.id, label: 'Shoutout', tokenAmount: 50, isActive: true }
    })
    const room = await db.room.create({
      data: { creatorId: creator.id, title: 'Prepared Room', slug: 'prepared-room', livekitRoomName: 'room-123', thumbnailMediaId: 'media-123', category: 'FEMALE', countryCode: 'US' },
    })

    const res = await app.inject({
      method: 'POST',
      url: `/creator/rooms/${room.id}/go-live`,
      headers: asAuth(testUserId),
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
    const creator = await createTestCreator(testUserId)
    const room = await createRoom(creator.id)
    const res = await app.inject({
      method: 'POST',
      url: `/creator/rooms/${room.id}/end`,
      headers: asAuth(testUserId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('endRoom', 200, res.json())
  })
})
