// Generated from openapi.yaml — fill in seeds and assertions.
// Run `pnpm test:generate` to add stubs for new routes.
// Both test users are pre-seeded: use testOtherUserId for cross-user permission tests.
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, testUserId } from './helpers'
import { db } from '@streamyolo/db'

const app = buildTestApp()

describe('createCheckout', () => {
  it('returns 403 when tokenPurchasesEnabled is false', async () => {
    await db.platformSettings.upsert({
      where: { id: 'singleton' },
      update: { activePaymentProvider: 'DEMO', tokenPurchasesEnabled: false },
      create: { id: 'singleton', activePaymentProvider: 'DEMO', tokenPurchasesEnabled: false },
    })

    const res = await app.inject({
      method: 'POST',
      url: '/payments/checkout',
      headers: asAuth(testUserId),
      payload: { tokenPackId: 'pack-500' },
    })

    expect(res.statusCode).toBe(403)
    expect(res.json().error).toBe('Token purchases are currently disabled')
  })

  it('handles DEMO token purchase immediately', async () => {
    // 1. Ensure settings are DEMO
    await db.platformSettings.upsert({
      where: { id: 'singleton' },
      update: { activePaymentProvider: 'DEMO', tokenPurchasesEnabled: true },
      create: { id: 'singleton', activePaymentProvider: 'DEMO', tokenPurchasesEnabled: true }
    })
    
    // 2. Ensure test user has a wallet
    await db.wallet.upsert({
      where: { userId: testUserId },
      update: {},
      create: { userId: testUserId, tokenBalance: 0 }
    })

    // 3. Ensure token pack exists
    await db.tokenPack.upsert({
      where: { id: 'pack-500' },
      update: { isActive: true },
      create: {
        id: 'pack-500',
        name: 'Demo 500',
        priceCents: 499,
        tokenAmount: 500,
        bonusTokenAmount: 0,
        currency: 'USD',
        isActive: true,
        sortOrder: 1,
      },
    })

    // 4. Make checkout request
    const res = await app.inject({
      method: 'POST',
      url: '/payments/checkout',
      headers: asAuth(testUserId),
      payload: { tokenPackId: 'pack-500' },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.status).toBe('APPROVED')
    expect(body.tokensCredited).toBe(500)

    // 5. Verify wallet and ledger
    const wallet = await db.wallet.findUnique({ where: { userId: testUserId } })
    expect(wallet?.tokenBalance).toBe(500)
    
    const ledger = await db.ledgerEntry.findFirst({
      where: { walletId: wallet!.id, type: 'DEMO_TOKEN_GRANT' }
    })
    expect(ledger).toBeDefined()
    expect(ledger?.amountTokens).toBe(500)
  })
})

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
