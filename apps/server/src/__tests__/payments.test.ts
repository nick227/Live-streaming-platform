// Generated from openapi.yaml — fill in seeds and assertions.
// Run `pnpm test:generate` to add stubs for new routes.
// Both test users are pre-seeded: use testOtherUserId for cross-user permission tests.
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, testUserId } from './helpers'
import { db } from '@streamyolo/db'

const app = buildTestApp()

describe('createCcbillCheckout', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/payments/ccbill/checkout' })
    expect(res.statusCode).toBe(401)
  })

  it('does not create a payment transaction when CCBill is not configured', async () => {
    const savedEnv = {
      CCBILL_CLIENT_ACCOUNT_NUM: process.env.CCBILL_CLIENT_ACCOUNT_NUM,
      CCBILL_CLIENT_SUB_ACCOUNT_NUM: process.env.CCBILL_CLIENT_SUB_ACCOUNT_NUM,
      CCBILL_FLEX_ID: process.env.CCBILL_FLEX_ID,
      CCBILL_SALT: process.env.CCBILL_SALT,
    }
    delete process.env.CCBILL_CLIENT_ACCOUNT_NUM
    delete process.env.CCBILL_CLIENT_SUB_ACCOUNT_NUM
    delete process.env.CCBILL_FLEX_ID
    delete process.env.CCBILL_SALT

    const res = await app.inject({
      method: 'POST',
      url: '/payments/ccbill/checkout',
      headers: asAuth(testUserId),
      payload: { tokenPackId: 'pack-100' },
    })

    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }

    expect(res.statusCode).toBe(503)
    expect(res.json()).toEqual({ error: 'Token purchases are disabled until payments are configured' })
    await expect(db.paymentTransaction.count()).resolves.toBe(0)
  })
})

describe('handleCcbillWebhook', () => {
  it('POST /webhooks/ccbill', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/ccbill',
      payload: {},
    })
    expect(res.statusCode).toBe(400)
  })
})
