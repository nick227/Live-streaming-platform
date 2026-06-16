import { db } from '@streamyolo/db'

const RESERVED_SESSION_STATUSES = ['REQUESTED', 'ACCEPTED', 'ACTIVE'] as const
const RESERVED_SESSION_STATUS_FILTER = [...RESERVED_SESSION_STATUSES]

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
    const [wallets, ledgerSums, reservedSums] = await Promise.all([
      db.wallet.findMany({
        include: {
          user: { select: { username: true, email: true } },
          ledgerEntries: {
            select: { balanceAfter: true },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 1,
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      db.ledgerEntry.groupBy({
        by: ['walletId'],
        _sum: { amountTokens: true },
      }),
      db.privateSession.groupBy({
        by: ['viewerId'],
        where: { status: { in: RESERVED_SESSION_STATUS_FILTER } },
        _sum: { reservedTokens: true },
      }),
    ])

    const ledgerSumByWalletId = new Map(
      ledgerSums.map((entry) => [entry.walletId, entry._sum.amountTokens ?? 0]),
    )
    const reservedSumByUserId = new Map(
      reservedSums.map((entry) => [entry.viewerId, entry._sum.reservedTokens ?? 0]),
    )

    const issues: WalletReconciliationIssue[] = []

    for (const wallet of wallets) {
      const ledgerSumTokenBalance = ledgerSumByWalletId.get(wallet.id) ?? 0
      const activeReservedTokenBalance = reservedSumByUserId.get(wallet.userId) ?? 0
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
