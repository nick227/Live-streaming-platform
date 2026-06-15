import { Link } from 'react-router-dom'
import { useCreatorProfile } from '@streamyolo/sdk'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Card, CardContent } from '@/components/ui/Card'
import { Pencil, Radio, Coins } from 'lucide-react'

export function CreatorProfilePage() {
  const { data, isLoading } = useCreatorProfile()

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-96" />
    </div>
  )

  const profile = (data as any) ?? null

  if (!profile) return (
    <div className="text-center space-y-4 py-12">
      <p className="text-muted-foreground">No creator profile yet.</p>
      <Button asChild>
        <Link to="/creator/profile/edit">Set Up Profile</Link>
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Banner */}
      {profile.bannerUrl && (
        <div className="h-32 rounded-xl overflow-hidden bg-muted">
          <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar src={profile.avatarUrl} name={profile.stageName ?? '?'} size="lg" />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold">{profile.stageName}</h1>
            <StatusBadge status={profile.status} />
            {profile.isLive && <StatusBadge status="LIVE" />}
          </div>
          {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/creator/profile/edit">
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Link>
        </Button>
      </div>

      {/* Private session rates */}
      {profile.privateRateTokensPerMinute > 0 && (
        <Card>
          <CardContent className="py-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Rate</p>
              <p className="font-semibold flex items-center gap-1">
                <Coins className="h-4 w-4 text-primary" />
                {profile.privateRateTokensPerMinute} tokens/min
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Min Duration</p>
              <p className="font-semibold">{profile.minPrivateMinutes ?? 1} min</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button asChild>
          <Link to="/creator/rooms/prepare">
            <Radio className="h-4 w-4 mr-2" />
            New Room
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/creator/menu-items">Tip Menu</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/creator/earnings">Earnings</Link>
        </Button>
      </div>
    </div>
  )
}
