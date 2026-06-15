import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAdminUser } from '@streamyolo/sdk'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Coins } from 'lucide-react'

export function AdminUserPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useAdminUser(userId!)

  if (isLoading) return <Skeleton className="h-64 w-full" />

  const detail = (data as any)?.data
  if (!detail) return <p className="text-muted-foreground">User not found.</p>

  const { user, wallet, creatorProfile } = detail

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/admin/users')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Users
      </button>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{user.displayName}</h1>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={user.role} />
          <StatusBadge status={user.status} />
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Wallet</p>
          <div className="flex items-center gap-2 mb-3">
            <Coins className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold">{wallet?.tokenBalance?.toLocaleString() ?? 0}</span>
            <span className="text-sm text-muted-foreground">tokens</span>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Reserved</dt>
            <dd>{wallet?.reservedTokenBalance?.toLocaleString() ?? 0}</dd>
            <dt className="text-muted-foreground">Lifetime purchased</dt>
            <dd>{wallet?.lifetimePurchasedTokens?.toLocaleString() ?? 0}</dd>
            <dt className="text-muted-foreground">Lifetime spent</dt>
            <dd>{wallet?.lifetimeSpentTokens?.toLocaleString() ?? 0}</dd>
          </dl>
        </CardContent>
      </Card>

      {creatorProfile && (
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Creator Profile</p>
            <div className="flex items-center justify-between">
              <span className="font-medium">{user.displayName}</span>
              <StatusBadge status={creatorProfile.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{creatorProfile.bio}</p>
          </CardContent>
        </Card>
      )}

      <dl className="text-sm text-muted-foreground">
        <dt className="inline">Joined </dt>
        <dd className="inline">{new Date(user.createdAt).toLocaleDateString()}</dd>
      </dl>

      <div className="flex gap-3 flex-wrap">
        <Button asChild variant="outline">
          <Link to={`/admin/wallets/${userId}`}>View Wallet</Link>
        </Button>
        <Button asChild variant="destructive">
          <Link to={`/admin/users/${userId}/suspend`}>Suspend</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={`/admin/users/${userId}/restore`}>Restore</Link>
        </Button>
      </div>
    </div>
  )
}
