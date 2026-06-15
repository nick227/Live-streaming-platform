import { db } from '@streamyolo/db'
import { encodeCursor, decodeCursor, normalizeLimit } from '../lib/pagination'

export class WalletService {
  async getWallet(userId: string, params: { cursor?: string; limit?: number }) {
    const limit = normalizeLimit(params.limit, 100, 20)
    const cursorPayload = decodeCursor(params.cursor)

    let wallet = await db.wallet.findUnique({ where: { userId } })
    if (!wallet) {
      wallet = await db.wallet.create({ data: { userId } })
    }

    const entries = await db.ledgerEntry.findMany({
      where: {
        walletId: wallet.id,
        ...(cursorPayload
          ? {
              OR: [
                { createdAt: { lt: new Date(cursorPayload.createdAt) } },
                { createdAt: new Date(cursorPayload.createdAt), id: { lt: cursorPayload.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    })

    const hasMore = entries.length > limit
    if (hasMore) entries.pop()

    const nextCursor = hasMore
      ? encodeCursor({
          createdAt: entries[entries.length - 1].createdAt.toISOString(),
          id: entries[entries.length - 1].id,
        })
      : null

    return {
      wallet: {
        tokenBalance: wallet.tokenBalance,
        reservedTokenBalance: wallet.reservedTokenBalance,
        lifetimePurchasedTokens: wallet.lifetimePurchasedTokens,
        lifetimeSpentTokens: wallet.lifetimeSpentTokens,
      },
      ledger: entries.map(formatLedgerEntry),
      meta: { hasMore, nextCursor },
    }
  }
}

export function formatLedgerEntry(entry: any) {
  return {
    id: entry.id,
    type: entry.type,
    amountTokens: entry.amountTokens,
    balanceAfter: entry.balanceAfter,
    description: entry.description ?? null,
    roomId: entry.roomId ?? null,
    tipId: entry.tipId ?? null,
    privateSessionId: entry.privateSessionId ?? null,
    paymentTransactionId: entry.paymentTransactionId ?? null,
    adminActionId: entry.adminActionId ?? null,
    createdAt: entry.createdAt.toISOString(),
  }
}
