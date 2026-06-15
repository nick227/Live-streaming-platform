import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAdminCreator } from '@streamyolo/sdk'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Coins, Radio } from 'lucide-react'

export function AdminCreatorPage() {
  const { creatorId } = useParams<{ creatorId: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useAdminCreator(creatorId!)

  if (isLoading) return <Skeleton className="h-64 w-full" />

  const creator = (data as any)?.data
  if (!creator) return <p className="text-muted-foreground">Creator not found.</p>

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/admin/creators')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Creators
      </button>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{creator.displayName}</h1>
          {creator.bio && <p className="text-sm text-muted-foreground mt-1">{creator.bio}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {creator.isLive && (
            <span className="flex items-center gap-1 text-xs font-medium text-destructive">
              <Radio className="h-3.5 w-3.5" /> LIVE
            </span>
          )}
          <StatusBadge status={creator.status} />
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Private Session Rules</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Rate</dt>
            <dd className="flex items-center gap-1">
              <Coins className="h-3.5 w-3.5 text-primary" />
              {creator.privateRateTokensPerMinute} tokens/min
            </dd>
            <dt className="text-muted-foreground">Min minutes</dt>
            <dd>{creator.minPrivateMinutes}</dd>
            <dt className="text-muted-foreground">Viewer cam required</dt>
            <dd>{creator.privateViewerCamRequired ? 'Yes' : 'No'}</dd>
            <dt className="text-muted-foreground">Screen share allowed</dt>
            <dd>{creator.privateScreenShareAllowed ? 'Yes' : 'No'}</dd>
          </dl>
        </CardContent>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <Button asChild variant="outline">
          <Link to={`/admin/creators/${creatorId}/approve`}>Approve</Link>
        </Button>
        <Button asChild variant="destructive">
          <Link to={`/admin/creators/${creatorId}/suspend`}>Suspend</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={`/admin/users/${creator.userId}`}>View User</Link>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Created {new Date(creator.createdAt).toLocaleDateString()}
      </p>
    </div>
  )
}
