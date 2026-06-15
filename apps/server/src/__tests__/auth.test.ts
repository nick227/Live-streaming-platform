// Generated from openapi.yaml — fill in seeds and assertions.
// Run `pnpm test:generate` to add stubs for new routes.
// Both test users are pre-seeded: use testOtherUserId for cross-user permission tests.
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId } from './helpers'
import { db } from '@streamyolo/db'
import * as argon2 from 'argon2'

const app = buildTestApp()

describe('register', () => {
  it('creates a new user with a 100-token starter wallet credit', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'starter@test.local',
        password: 'password123',
        displayName: 'Starter Fan',
      },
    })
    expect(res.statusCode).toBe(201)
    await validateResponse('register', 201, res.json())

    const user = await db.user.findUniqueOrThrow({
      where: { email: 'starter@test.local' },
      include: { wallet: { include: { ledgerEntries: true } } },
    })

    expect(user.wallet?.tokenBalance).toBe(100)
    expect(user.wallet?.reservedTokenBalance).toBe(0)
    expect(user.wallet?.lifetimePurchasedTokens).toBe(0)
    expect(user.wallet?.ledgerEntries).toEqual([
      expect.objectContaining({
        type: 'ADMIN_ADJUSTMENT',
        amountTokens: 100,
        balanceAfter: 100,
        description: 'Starter token credit',
      }),
    ])
    expect(res.headers['set-cookie']).toBeDefined()
  })
})

describe('login', () => {
  it('POST /auth/login', async () => {
    await db.user.update({
      where: { id: testUserId },
      data: { passwordHash: await argon2.hash('password123') },
    })

    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'alice@test.local',
        password: 'password123',
      },
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('login', 200, res.json())
  })
})

describe('logout', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/logout' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /auth/logout', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: asAuth(testUserId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('logout', 200, res.json())
  })
})

describe('getCurrentUser', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/me' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /auth/me', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: asAuth(testUserId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getCurrentUser', 200, res.json())
  })
})
