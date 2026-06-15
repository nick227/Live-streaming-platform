import { db } from '@streamyolo/db'

const RESERVED_SESSION_STATUSES = ['REQUESTED', 'ACCEPTED', 'ACTIVE'] as const

export interface WalletReconciliationIssue {
  userId: string
  walletId: string
  username: string
  email: string
  storedTokenBalance: number
  ledgerSumTokenBalance: number
  latestLedgerBalanceAfter: number | null
  storedReservedTokenBalance: number
  activeReservedTokenBalance: number
  tokenBalanceDeltaFromLedgerSum: number
  tokenBalanceDeltaFromLatestLedger: number | null
  reservedTokenBalanceDelta: number
}

export interface WalletReconciliationReport {
  checkedWallets: number
  issueCount: number
  issues: WalletReconciliationIssue[]
}

export class WalletReconciliationService {
  async check(): Promise<WalletReconciliationReport> {
    const wallets = await db.wallet.findMany({
      include: {
        user: { select: { id: true, username: true, email: true } },
        ledgerEntries: {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const issues: WalletReconciliationIssue[] = []

    for (const wallet of wallets) {
      const [ledgerSum, reservedSum] = await Promise.all([
        db.ledgerEntry.aggregate({
          where: { walletId: wallet.id },
          _sum: { amountTokens: true },
        }),
        db.privateSession.aggregate({
          where: {
            viewerId: wallet.userId,
            status: { in: [...RESERVED_SESSION_STATUSES] },
          },
          _sum: { reservedTokens: true },
        }),
      ])

      const ledgerSumTokenBalance = ledgerSum._sum.amountTokens ?? 0
      const activeReservedTokenBalance = reservedSum._sum.reservedTokens ?? 0
      const latestLedgerBalanceAfter = wallet.ledgerEntries[0]?.balanceAfter ?? null
      const tokenBalanceDeltaFromLedgerSum = wallet.tokenBalance - ledgerSumTokenBalance
      const tokenBalanceDeltaFromLatestLedger =
        latestLedgerBalanceAfter === null ? null : wallet.tokenBalance - latestLedgerBalanceAfter
      const reservedTokenBalanceDelta = wallet.reservedTokenBalance - activeReservedTokenBalance

      if (
        tokenBalanceDeltaFromLedgerSum !== 0 ||
        (tokenBalanceDeltaFromLatestLedger !== null && tokenBalanceDeltaFromLatestLedger !== 0) ||
        reservedTokenBalanceDelta !== 0
      ) {
        issues.push({
          userId: wallet.userId,
          walletId: wallet.id,
          username: wallet.user.username,
          email: wallet.user.email,
          storedTokenBalance: wallet.tokenBalance,
          ledgerSumTokenBalance,
          latestLedgerBalanceAfter,
          storedReservedTokenBalance: wallet.reservedTokenBalance,
          activeReservedTokenBalance,
          tokenBalanceDeltaFromLedgerSum,
          tokenBalanceDeltaFromLatestLedger,
          reservedTokenBalanceDelta,
        })
      }
    }

    return {
      checkedWallets: wallets.length,
      issueCount: issues.length,
      issues,
    }
  }
}
