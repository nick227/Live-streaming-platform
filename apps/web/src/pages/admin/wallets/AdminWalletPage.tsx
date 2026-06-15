import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAdminWallet } from '@streamyolo/sdk'
import { LedgerList } from '@/components/wallet/LedgerList'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Coins } from 'lucide-react'

export function AdminWalletPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useAdminWallet(userId!)

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-xl" />
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
    </div>
  )

  const inner = (data as any)?.data
  if (!inner) return <p className="text-muted-foreground">Wallet not found.</p>

  const wallet = inner.wallet
  const ledger: any[] = inner.ledger ?? []

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/admin/users')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Users
      </button>
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold">Wallet</h1>
        <Button asChild size="sm">
          <Link to={`/admin/wallets/${userId}/adjust`}>Adjust</Link>
        </Button>
      </div>

      <Card className="bg-primary text-primary-foreground">
        <CardContent className="py-6">
          <p className="text-sm opacity-80">Token Balance</p>
          <div className="flex items-center gap-2 mt-1">
            <Coins className="h-6 w-6" />
            <span className="text-4xl font-bold">{(wallet?.tokenBalance ?? 0).toLocaleString()}</span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm opacity-80">
            <dt>Reserved</dt>
            <dd>{(wallet?.reservedTokenBalance ?? 0).toLocaleString()}</dd>
            <dt>Lifetime purchased</dt>
            <dd>{(wallet?.lifetimePurchasedTokens ?? 0).toLocaleString()}</dd>
          </dl>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Ledger</h2>
        <LedgerList
          ledger={ledger}
          emptyTitle="No entries"
          emptyDescription="Ledger entries will appear here."
        />
      </div>
    </div>
  )
}
