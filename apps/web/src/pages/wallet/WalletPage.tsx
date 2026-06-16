import { useWallet } from '@streamyolo/sdk'
import { Link, useLocation } from 'react-router-dom'
import { LedgerEntryRow } from '@/components/wallet/LedgerEntryRow'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Coins, ShoppingCart } from 'lucide-react'

export function WalletPage() {
  const location = useLocation()
  const { data, isLoading } = useWallet()
  const returnRoute = { pathname: location.pathname, search: location.search, hash: location.hash }

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-4 w-24" />
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
    </div>
  )

  const inner = (data as any)?.data
  const balance: number = inner?.wallet?.tokenBalance ?? 0
  const ledger: any[] = inner?.ledger ?? []

  return (
    <div className="space-y-6">
      {/* Balance card */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="py-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm opacity-80">Token Balance</p>
            <div className="flex items-center gap-2">
              <Coins className="h-6 w-6" />
              <span className="text-4xl font-bold">{balance.toLocaleString()}</span>
            </div>
          </div>
          <Button asChild variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Link to="/token-packs" state={{ from: returnRoute }}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Buy Tokens
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Ledger */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Transaction History</h2>
        {ledger.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="No transactions yet"
            description="Buy tokens or receive tips to see your history here."
          />
        ) : (
          <Card>
            <CardContent className="py-2 px-4">
              {ledger.map((entry: any) => (
                <LedgerEntryRow key={entry.id} entry={entry} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
