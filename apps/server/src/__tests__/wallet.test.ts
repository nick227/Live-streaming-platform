// Generated from openapi.yaml — fill in seeds and assertions.
// Run `pnpm test:generate` to add stubs for new routes.
// Both test users are pre-seeded: use testOtherUserId for cross-user permission tests.
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId } from './helpers'
import { db } from '@streamyolo/db'
import { WalletReconciliationService } from '../services/WalletReconciliationService'

const app = buildTestApp()

describe('getWallet', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/wallet' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /wallet', async () => {
    // TODO: seed domain data (test users are pre-seeded by buildTestApp)
    const res = await app.inject({
      method: 'GET',
      url: '/wallet',
      headers: asAuth(testUserId),
      // payload: {},
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getWallet', 200, res.json())
  })
})

describe('WalletReconciliationService', () => {
  it('passes when wallet balances match ledger and active reservations', async () => {
    const wallet = await db.wallet.create({
      data: {
        userId: testUserId,
        tokenBalance: 100,
        reservedTokenBalance: 50,
      },
    })

    await db.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        userId: testUserId,
        type: 'ADMIN_ADJUSTMENT',
        amountTokens: 100,
        balanceAfter: 100,
        description: 'Test credit',
      },
    })

    await seedPrivateSession({ reservedTokens: 50, status: 'REQUESTED' })

    const report = await new WalletReconciliationService().check()

    expect(report.checkedWallets).toBe(1)
    expect(report.issueCount).toBe(0)
    expect(report.issues).toEqual([])
  })

  it('reports token and reserved balance drift', async () => {
    const wallet = await db.wallet.create({
      data: {
        userId: testUserId,
        tokenBalance: 75,
        reservedTokenBalance: 10,
      },
    })

    await db.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        userId: testUserId,
        type: 'ADMIN_ADJUSTMENT',
        amountTokens: 100,
        balanceAfter: 100,
        description: 'Test credit',
      },
    })

    const report = await new WalletReconciliationService().check()

    expect(report.checkedWallets).toBe(1)
    expect(report.issueCount).toBe(1)
    expect(report.issues[0]).toEqual(
      expect.objectContaining({
        userId: testUserId,
        storedTokenBalance: 75,
        ledgerSumTokenBalance: 100,
        latestLedgerBalanceAfter: 100,
        storedReservedTokenBalance: 10,
        activeReservedTokenBalance: 0,
        tokenBalanceDeltaFromLedgerSum: -25,
        tokenBalanceDeltaFromLatestLedger: -25,
        reservedTokenBalanceDelta: 10,
      }),
    )
  })
})

async function seedPrivateSession(input: { reservedTokens: number; status: 'REQUESTED' | 'ACCEPTED' | 'ACTIVE' }) {
  const creator = await db.creatorProfile.create({
    data: {
      userId: testOtherUserId,
      status: 'ACTIVE',
      privateRateTokensPerMinute: 10,
      minPrivateMinutes: 5,
      privateRulesText: 'Test rules',
    },
  })

  const room = await db.room.create({
    data: {
      creatorId: creator.id,
      title: `Test Room ${input.status}`,
      status: 'LIVE',
      livekitRoomName: `test-room-${input.status.toLowerCase()}`,
    },
  })

  return db.privateSession.create({
    data: {
      creatorId: creator.id,
      viewerId: testUserId,
      publicRoomId: room.id,
      status: input.status,
      rateTokensPerMinute: 10,
      minMinutes: 5,
      reservedTokens: input.reservedTokens,
    },
  })
}
