import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, createTestCreator } from './helpers'
import { db } from '@streamyolo/db'

const app = buildTestApp()

describe('listCreatorMenuItems', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/creator/menu-items' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /creator/menu-items', async () => {
    const creator = await createTestCreator(testUserId)
    await db.creatorMenuItem.create({
      data: { creatorId: creator.id, label: 'Shoutout', tokenAmount: 50, isActive: true }
    })
    
    const res = await app.inject({
      method: 'GET',
      url: '/creator/menu-items',
      headers: asAuth(testUserId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listCreatorMenuItems', 200, res.json())
  })
})

describe('createCreatorMenuItem', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/creator/menu-items' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /creator/menu-items', async () => {
    await createTestCreator(testUserId)
    const res = await app.inject({
      method: 'POST',
      url: '/creator/menu-items',
      headers: asAuth(testUserId),
      payload: { label: 'Dance', tokenAmount: 100 },
    })
    expect(res.statusCode).toBe(201)
    await validateResponse('createCreatorMenuItem', 201, res.json())
  })
})

describe('updateCreatorMenuItem', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'PATCH', url: '/creator/menu-items/00000000-0000-0000-0000-000000000001' })
    expect(res.statusCode).toBe(401)
  })

  it('PATCH /creator/menu-items/{menuItemId}', async () => {
    const creator = await createTestCreator(testUserId)
    const item = await db.creatorMenuItem.create({
      data: { creatorId: creator.id, label: 'Shoutout', tokenAmount: 50, isActive: true }
    })

    const res = await app.inject({
      method: 'PATCH',
      url: `/creator/menu-items/${item.id}`,
      headers: asAuth(testUserId),
      payload: { label: 'Big Shoutout', tokenAmount: 75 },
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('updateCreatorMenuItem', 200, res.json())
  })
})

describe('deleteCreatorMenuItem', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/creator/menu-items/00000000-0000-0000-0000-000000000001' })
    expect(res.statusCode).toBe(401)
  })

  it('DELETE /creator/menu-items/{menuItemId}', async () => {
    const creator = await createTestCreator(testUserId)
    const item = await db.creatorMenuItem.create({
      data: { creatorId: creator.id, label: 'Shoutout', tokenAmount: 50, isActive: true }
    })

    const res = await app.inject({
      method: 'DELETE',
      url: `/creator/menu-items/${item.id}`,
      headers: asAuth(testUserId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('deleteCreatorMenuItem', 200, res.json())
  })
})
