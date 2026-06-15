// Generated from openapi.yaml — fill in seeds and assertions.
// Run `pnpm test:generate` to add stubs for new routes.
// Both test users are pre-seeded: use testOtherUserId for cross-user permission tests.
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId } from './helpers'

const app = buildTestApp()

describe('createCcbillCheckout', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/payments/ccbill/checkout' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /payments/ccbill/checkout', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/payments/ccbill/checkout',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('createCcbillCheckout', 200, res.json())
  })
})

describe('handleCcbillWebhook', () => {
  it('POST /webhooks/ccbill', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/ccbill',
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('handleCcbillWebhook', 200, res.json())
  })
})
