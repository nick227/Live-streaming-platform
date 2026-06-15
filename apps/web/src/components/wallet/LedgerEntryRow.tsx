import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  TOKEN_PURCHASE: 'Purchase',
  TIP_SENT: 'Tip sent',
  TIP_RECEIVED: 'Tip received',
  PRIVATE_SESSION_HOLD: 'Session hold',
  PRIVATE_SESSION_CAPTURE: 'Session charge',
  PRIVATE_SESSION_RELEASE: 'Session refund',
  REFUND_REVERSAL: 'Refund',
  CHARGEBACK_REVERSAL: 'Chargeback',
  ADMIN_ADJUSTMENT: 'Adjustment',
}

interface LedgerEntryRowProps {
  entry: {
    id: string
    type: string
    amountTokens: number
    description?: string | null
    createdAt: string
  }
}

export function LedgerEntryRow({ entry }: LedgerEntryRowProps) {
  const isCredit = entry.amountTokens > 0
  const label = TYPE_LABELS[entry.type] ?? entry.type
  const date = new Date(entry.createdAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="space-y-0.5">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {label}
        </span>
        {entry.description && (
          <p className="text-sm text-foreground pl-0.5">{entry.description}</p>
        )}
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
      <span className={cn('font-semibold text-sm tabular-nums', isCredit ? 'text-green-500' : 'text-foreground')}>
        {isCredit ? '+' : ''}{entry.amountTokens.toLocaleString()} tokens
      </span>
    </div>
  )
}
