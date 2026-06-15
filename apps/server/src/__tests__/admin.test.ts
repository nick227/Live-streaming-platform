import { describe, it, expect } from 'vitest'
import {
  buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId, testAdminId,
  createTestCreator, createRoom, createWallet, createPayment, createPrivateSession, createMediaAsset, createReport
} from './helpers'

const app = buildTestApp()

describe('getAdminOverview', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/overview' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /admin/overview', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin/overview',
      headers: asAuth(testAdminId),
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
    await createTestCreator(testOtherUserId)
    await createRoom(testOtherUserId)
    const res = await app.inject({
      method: 'GET',
      url: '/admin/rooms',
      headers: asAuth(testAdminId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listAdminRooms', 200, res.json())
  })
})

describe('getAdminRoom', () => {
  it('GET /admin/rooms/{roomId}', async () => {
    await createTestCreator(testOtherUserId)
    const room = await createRoom(testOtherUserId)
    const res = await app.inject({
      method: 'GET',
      url: `/admin/rooms/${room.id}`,
      headers: asAuth(testAdminId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getAdminRoom', 200, res.json())
  })
})

describe('adminEndRoom', () => {
  it('POST /admin/rooms/{roomId}/end', async () => {
    await createTestCreator(testOtherUserId)
    const room = await createRoom(testOtherUserId)
    const res = await app.inject({
      method: 'POST',
      url: `/admin/rooms/${room.id}/end`,
      headers: asAuth(testAdminId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminEndRoom', 200, res.json())
  })
})

describe('adminHideRoom', () => {
  it('POST /admin/rooms/{roomId}/hide', async () => {
    await createTestCreator(testOtherUserId)
    const room = await createRoom(testOtherUserId)
    const res = await app.inject({
      method: 'POST',
      url: `/admin/rooms/${room.id}/hide`,
      headers: asAuth(testAdminId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminHideRoom', 200, res.json())
  })
})

describe('listAdminUsers', () => {
  it('GET /admin/users', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin/users',
      headers: asAuth(testAdminId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listAdminUsers', 200, res.json())
  })
})

describe('getAdminUser', () => {
  it('GET /admin/users/{userId}', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/admin/users/${testOtherUserId}`,
      headers: asAuth(testAdminId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getAdminUser', 200, res.json())
  })
})

describe('adminSuspendUser', () => {
  it('POST /admin/users/{userId}/suspend', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/admin/users/${testOtherUserId}/suspend`,
      headers: asAuth(testAdminId),
      payload: { reason: 'Violation' },
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminSuspendUser', 200, res.json())
  })
})

describe('adminRestoreUser', () => {
  it('POST /admin/users/{userId}/restore', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/admin/users/${testOtherUserId}/restore`,
      headers: asAuth(testAdminId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminRestoreUser', 200, res.json())
  })
})

describe('listAdminCreators', () => {
  it('GET /admin/creators', async () => {
    await createTestCreator(testOtherUserId)
    const res = await app.inject({
      method: 'GET',
      url: '/admin/creators',
      headers: asAuth(testAdminId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listAdminCreators', 200, res.json())
  })
})

describe('adminApproveCreator', () => {
  it('POST /admin/creators/{creatorId}/approve', async () => {
    const creator = await createTestCreator(testOtherUserId)
    const res = await app.inject({
      method: 'POST',
      url: `/admin/creators/${creator.id}/approve`,
      headers: asAuth(testAdminId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminApproveCreator', 200, res.json())
  })
})

describe('adminSuspendCreator', () => {
  it('POST /admin/creators/{creatorId}/suspend', async () => {
    const creator = await createTestCreator(testOtherUserId)
    const res = await app.inject({
      method: 'POST',
      url: `/admin/creators/${creator.id}/suspend`,
      headers: asAuth(testAdminId),
      payload: { reason: 'Violation' },
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminSuspendCreator', 200, res.json())
  })
})

describe('listAdminPayments', () => {
  it('GET /admin/payments', async () => {
    await createPayment(testOtherUserId)
    const res = await app.inject({
      method: 'GET',
      url: '/admin/payments',
      headers: asAuth(testAdminId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listAdminPayments', 200, res.json())
  })
})

describe('getAdminPayment', () => {
  it('GET /admin/payments/{paymentId}', async () => {
    const payment = await createPayment(testOtherUserId)
    const res = await app.inject({
      method: 'GET',
      url: `/admin/payments/${payment.id}`,
      headers: asAuth(testAdminId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getAdminPayment', 200, res.json())
  })
})

describe('getAdminWallet', () => {
  it('GET /admin/wallets/{userId}', async () => {
    await createWallet(testOtherUserId)
    const res = await app.inject({
      method: 'GET',
      url: `/admin/wallets/${testOtherUserId}`,
      headers: asAuth(testAdminId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getAdminWallet', 200, res.json())
  })
})

describe('adminAdjustWallet', () => {
  it('POST /admin/wallets/{userId}/adjust', async () => {
    await createWallet(testOtherUserId)
    const res = await app.inject({
      method: 'POST',
      url: `/admin/wallets/${testOtherUserId}/adjust`,
      headers: asAuth(testAdminId),
      payload: { amountTokens: 100, reason: 'Bonus', adjustmentType: 'BONUS' },
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminAdjustWallet', 200, res.json())
  })
})

describe('listAdminPrivateSessions', () => {
  it('GET /admin/private-sessions', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin/private-sessions',
      headers: asAuth(testAdminId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listAdminPrivateSessions', 200, res.json())
  })
})

describe('adminForceEndPrivateSession', () => {
  it('POST /admin/private-sessions/{sessionId}/force-end', async () => {
    await createTestCreator(testOtherUserId)
    const room = await createRoom(testOtherUserId)
    const session = await createPrivateSession(room.id, testUserId)
    const res = await app.inject({
      method: 'POST',
      url: `/admin/private-sessions/${session.id}/force-end`,
      headers: asAuth(testAdminId),
      payload: { reason: 'Violation' },
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminForceEndPrivateSession', 200, res.json())
  })
})

describe('listAdminMedia', () => {
  it('GET /admin/media', async () => {
    await createMediaAsset(testOtherUserId)
    const res = await app.inject({
      method: 'GET',
      url: '/admin/media',
      headers: asAuth(testAdminId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listAdminMedia', 200, res.json())
  })
})

describe('adminApproveMedia', () => {
  it('POST /admin/media/{mediaId}/approve', async () => {
    const media = await createMediaAsset(testOtherUserId)
    const res = await app.inject({
      method: 'POST',
      url: `/admin/media/${media.id}/approve`,
      headers: asAuth(testAdminId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminApproveMedia', 200, res.json())
  })
})

describe('adminHideMedia', () => {
  it('POST /admin/media/{mediaId}/hide', async () => {
    const media = await createMediaAsset(testOtherUserId)
    const res = await app.inject({
      method: 'POST',
      url: `/admin/media/${media.id}/hide`,
      headers: asAuth(testAdminId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminHideMedia', 200, res.json())
  })
})

describe('listAdminReports', () => {
  it('GET /admin/reports', async () => {
    await createReport(testOtherUserId, testUserId)
    const res = await app.inject({
      method: 'GET',
      url: '/admin/reports',
      headers: asAuth(testAdminId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listAdminReports', 200, res.json())
  })
})

describe('adminReviewReport', () => {
  it('POST /admin/reports/{reportId}/review', async () => {
    const report = await createReport(testOtherUserId, testUserId)
    const res = await app.inject({
      method: 'POST',
      url: `/admin/reports/${report.id}/review`,
      headers: asAuth(testAdminId),
      payload: { status: 'DISMISSED' },
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('adminReviewReport', 200, res.json())
  })
})
