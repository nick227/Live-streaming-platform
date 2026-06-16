import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '@streamyolo/sdk'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Coins, ShoppingCart } from 'lucide-react'

export function ProfileWalletCard() {
  const location = useLocation()
  const { data, isLoading } = useWallet()
  const returnRoute = { pathname: location.pathname, search: location.search, hash: location.hash }

  if (isLoading) return <Skeleton className="h-28 w-full rounded-xl" />

  const inner = (data as { data?: { wallet?: { tokenBalance?: number } } })?.data
  const balance = inner?.wallet?.tokenBalance ?? 0

  return (
    <Card className="bg-primary text-primary-foreground">
      <CardContent className="py-5 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm opacity-80">Token Balance</p>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            <span className="text-3xl font-bold">{balance.toLocaleString()}</span>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 shrink-0">
          <Link to="/token-packs" state={{ from: returnRoute }}>
            <ShoppingCart className="h-4 w-4 mr-1.5" />
            Buy Tokens
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
