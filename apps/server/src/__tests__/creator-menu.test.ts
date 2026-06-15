// Generated from openapi.yaml — fill in seeds and assertions.
// Run `pnpm test:generate` to add stubs for new routes.
// Both test users are pre-seeded: use testOtherUserId for cross-user permission tests.
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId } from './helpers'

const app = buildTestApp()

describe('listCreatorMenuItems', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/creator/menu-items' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /creator/menu-items', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/creator/menu-items',
      headers: asAuth(testUserId),
      // payload: {},
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
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/creator/menu-items',
      headers: asAuth(testUserId),
      // payload: {},
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
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'PATCH',
      url: '/creator/menu-items/00000000-0000-0000-0000-000000000001',
      headers: asAuth(testUserId),
      // payload: {},
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
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'DELETE',
      url: '/creator/menu-items/00000000-0000-0000-0000-000000000001',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('deleteCreatorMenuItem', 200, res.json())
  })
})
