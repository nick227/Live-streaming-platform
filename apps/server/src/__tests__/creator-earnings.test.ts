import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, createTestCreator, createWallet } from './helpers'

const app = buildTestApp()

describe('getCreatorEarnings', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/creator/earnings' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /creator/earnings', async () => {
    await createTestCreator(testUserId)
    await createWallet(testUserId)
    const res = await app.inject({
      method: 'GET',
      url: '/creator/earnings',
      headers: asAuth(testUserId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getCreatorEarnings', 200, res.json())
  })
})
