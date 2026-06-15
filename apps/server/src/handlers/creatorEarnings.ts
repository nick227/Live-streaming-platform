import { db } from '@streamyolo/db'
import { encodeCursor, decodeCursor, normalizeLimit } from '../lib/pagination'
import { formatLedgerEntry } from '../services/WalletService'

export async function getCreatorEarnings(request: any, reply: any) {
  const { cursor, limit } = request.query ?? {}
  const take = normalizeLimit(limit)
  const cursorPayload = decodeCursor(cursor)

  const creator = await db.creatorProfile.findUnique({ where: { userId: request.user.id } })
  if (!creator) throw { statusCode: 404, message: 'Creator profile not found' }

  const wallet = await db.wallet.findUnique({ where: { userId: request.user.id } })
  if (!wallet) throw { statusCode: 404, message: 'Wallet not found' }

  const entries = await db.ledgerEntry.findMany({
    where: {
      walletId: wallet.id,
      type: { in: ['TIP_RECEIVED', 'PRIVATE_SESSION_CAPTURE'] },
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
    take: take + 1,
  })

  const hasMore = entries.length > take
  if (hasMore) entries.pop()

  const nextCursor = hasMore
    ? encodeCursor({ createdAt: entries[entries.length - 1].createdAt.toISOString(), id: entries[entries.length - 1].id })
    : null

  // Aggregate totals
  const totals = await db.ledgerEntry.groupBy({
    by: ['type'],
    where: {
      walletId: wallet.id,
      type: { in: ['TIP_RECEIVED', 'PRIVATE_SESSION_CAPTURE'] },
    },
    _sum: { amountTokens: true },
  })

  const summary: Record<string, number> = {}
  for (const t of totals) {
    summary[t.type] = t._sum.amountTokens ?? 0
  }

  return reply.send({
    data: {
      pendingTokenBalance: creator.pendingTokenBalance,
      totalTipsReceivedTokens: summary['TIP_RECEIVED'] ?? 0,
      totalPrivateSessionTokens: summary['PRIVATE_SESSION_CAPTURE'] ?? 0,
      ledger: entries.map(formatLedgerEntry),
      meta: { hasMore, nextCursor },
    },
  })
}
