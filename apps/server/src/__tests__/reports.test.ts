import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId } from './helpers'

const app = buildTestApp()

describe('createReport', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/reports' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /reports', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/reports',
      headers: asAuth(testUserId),
      payload: { targetType: 'USER', targetUserId: testOtherUserId, reason: 'SPAM' },
    })
    expect(res.statusCode).toBe(201)
    await validateResponse('createReport', 201, res.json())
  })
})
