import { useCreatorEarnings } from '@streamyolo/sdk'
import { LedgerList } from '@/components/wallet/LedgerList'
import { LedgerLoadingSkeleton } from '@/components/wallet/LedgerLoadingSkeleton'
import { Card, CardContent } from '@/components/ui/Card'
import { Coins } from 'lucide-react'

export function CreatorEarningsPage() {
  const { data, isLoading } = useCreatorEarnings()

  if (isLoading) return <LedgerLoadingSkeleton />

  const inner = (data as any)?.data
  const pendingBalance: number = inner?.pendingTokenBalance ?? 0
  const ledger: any[] = inner?.ledger ?? []

  return (
    <div className="space-y-6">
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="py-6">
          <p className="text-sm opacity-80">Pending Earnings</p>
          <div className="flex items-center gap-2 mt-1">
            <Coins className="h-6 w-6" />
            <span className="text-4xl font-bold">{pendingBalance.toLocaleString()}</span>
            <span className="text-sm opacity-80">tokens</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Earnings History</h2>
        <LedgerList
          ledger={ledger}
          emptyTitle="No earnings yet"
          emptyDescription="Go live and receive tips to see your earnings here."
        />
      </div>
    </div>
  )
}
