// Generated from openapi.yaml — fill in seeds and assertions.
// Run `pnpm test:generate` to add stubs for new routes.
// Both test users are pre-seeded: use testOtherUserId for cross-user permission tests.
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId } from './helpers'

const app = buildTestApp()

describe('getAdminOverview', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/overview' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /admin/overview', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/admin/overview',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getAdminOverview', 200, res.json())
  })
})

describe('listAdminRooms', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/rooms' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /admin/rooms', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/admin/rooms',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listAdminRooms', 200, res.json())
  })
})

describe('getAdminRoom', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/rooms/00000000-0000-0000-0000-000000000001' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /admin/rooms/{roomId}', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/admin/rooms/00000000-0000-0000-0000-000000000001',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getAdminRoom', 200, res.json())
  })
})

describe('adminEndRoom', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/rooms/00000000-0000-0000-0000-000000000001/end' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /admin/rooms/{roomId}/end', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/admin/rooms/00000000-0000-0000-0000-000000000001/end',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminEndRoom', 200, res.json())
  })
})

describe('adminHideRoom', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/rooms/00000000-0000-0000-0000-000000000001/hide' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /admin/rooms/{roomId}/hide', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/admin/rooms/00000000-0000-0000-0000-000000000001/hide',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminHideRoom', 200, res.json())
  })
})

describe('listAdminUsers', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/users' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /admin/users', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/admin/users',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listAdminUsers', 200, res.json())
  })
})

describe('getAdminUser', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/users/00000000-0000-0000-0000-000000000001' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /admin/users/{userId}', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/admin/users/00000000-0000-0000-0000-000000000001',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getAdminUser', 200, res.json())
  })
})

describe('adminSuspendUser', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/users/00000000-0000-0000-0000-000000000001/suspend' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /admin/users/{userId}/suspend', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/admin/users/00000000-0000-0000-0000-000000000001/suspend',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminSuspendUser', 200, res.json())
  })
})

describe('adminRestoreUser', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/users/00000000-0000-0000-0000-000000000001/restore' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /admin/users/{userId}/restore', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/admin/users/00000000-0000-0000-0000-000000000001/restore',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminRestoreUser', 200, res.json())
  })
})

describe('listAdminCreators', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/creators' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /admin/creators', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/admin/creators',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listAdminCreators', 200, res.json())
  })
})

describe('adminApproveCreator', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/creators/00000000-0000-0000-0000-000000000001/approve' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /admin/creators/{creatorId}/approve', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/admin/creators/00000000-0000-0000-0000-000000000001/approve',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminApproveCreator', 200, res.json())
  })
})

describe('adminSuspendCreator', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/creators/00000000-0000-0000-0000-000000000001/suspend' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /admin/creators/{creatorId}/suspend', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/admin/creators/00000000-0000-0000-0000-000000000001/suspend',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminSuspendCreator', 200, res.json())
  })
})

describe('listAdminPayments', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/payments' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /admin/payments', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/admin/payments',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listAdminPayments', 200, res.json())
  })
})

describe('getAdminPayment', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/payments/00000000-0000-0000-0000-000000000001' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /admin/payments/{paymentId}', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/admin/payments/00000000-0000-0000-0000-000000000001',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getAdminPayment', 200, res.json())
  })
})

describe('getAdminWallet', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/wallets/00000000-0000-0000-0000-000000000001' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /admin/wallets/{userId}', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/admin/wallets/00000000-0000-0000-0000-000000000001',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getAdminWallet', 200, res.json())
  })
})

describe('adminAdjustWallet', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/wallets/00000000-0000-0000-0000-000000000001/adjust' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /admin/wallets/{userId}/adjust', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/admin/wallets/00000000-0000-0000-0000-000000000001/adjust',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminAdjustWallet', 200, res.json())
  })
})

describe('listAdminPrivateSessions', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/private-sessions' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /admin/private-sessions', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/admin/private-sessions',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listAdminPrivateSessions', 200, res.json())
  })
})

describe('adminForceEndPrivateSession', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/private-sessions/00000000-0000-0000-0000-000000000001/force-end' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /admin/private-sessions/{sessionId}/force-end', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/admin/private-sessions/00000000-0000-0000-0000-000000000001/force-end',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminForceEndPrivateSession', 200, res.json())
  })
})

describe('listAdminMedia', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/media' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /admin/media', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/admin/media',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listAdminMedia', 200, res.json())
  })
})

describe('adminApproveMedia', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/media/00000000-0000-0000-0000-000000000001/approve' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /admin/media/{mediaId}/approve', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/admin/media/00000000-0000-0000-0000-000000000001/approve',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminApproveMedia', 200, res.json())
  })
})

describe('adminHideMedia', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/media/00000000-0000-0000-0000-000000000001/hide' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /admin/media/{mediaId}/hide', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/admin/media/00000000-0000-0000-0000-000000000001/hide',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminHideMedia', 200, res.json())
  })
})

describe('listAdminReports', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/reports' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /admin/reports', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/admin/reports',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listAdminReports', 200, res.json())
  })
})

describe('adminReviewReport', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/reports/00000000-0000-0000-0000-000000000001/review' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /admin/reports/{reportId}/review', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/admin/reports/00000000-0000-0000-0000-000000000001/review',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminReviewReport', 200, res.json())
  })
})
