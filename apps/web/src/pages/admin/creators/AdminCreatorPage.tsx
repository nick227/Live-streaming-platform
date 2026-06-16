import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAdminCreator } from '@streamyolo/sdk'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
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
      <button
        onClick={() => navigate('/admin/creators')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Creators
      </button>

      <div className="flex items-start gap-4">
        <Avatar src={creator.avatarUrl} name={creator.displayName} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold">{creator.displayName}</h1>
            {creator.isLive && (
              <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                <Radio className="h-3.5 w-3.5" /> LIVE
              </span>
            )}
            <StatusBadge status={creator.status} />
          </div>
          {creator.username && (
            <p className="text-sm text-muted-foreground mt-0.5">@{creator.username}</p>
          )}
          {creator.bio && (
            <p className="text-sm text-muted-foreground mt-1">{creator.bio}</p>
          )}
        </div>
      </div>

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

      <Card>
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Details</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {creator.defaultRoomCategory && (
              <>
                <dt className="text-muted-foreground">Category</dt>
                <dd>{creator.defaultRoomCategory}</dd>
              </>
            )}
            {creator.defaultCountryCode && (
              <>
                <dt className="text-muted-foreground">Country</dt>
                <dd>{creator.defaultCountryCode.toUpperCase()}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Payout status</dt>
            <dd>{creator.payoutStatus}</dd>
            <dt className="text-muted-foreground">Pending balance</dt>
            <dd className="flex items-center gap-1">
              <Coins className="h-3.5 w-3.5 text-primary" />
              {creator.pendingTokenBalance} tokens
            </dd>
            <dt className="text-muted-foreground">Joined</dt>
            <dd>{new Date(creator.createdAt).toLocaleDateString()}</dd>
          </dl>
          {(creator.defaultRoomTags ?? []).length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1.5">Default tags</p>
              <div className="flex flex-wrap gap-1.5">
                {creator.defaultRoomTags.map((tag: any) => (
                  <span
                    key={tag.slug}
                    className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
          {creator.privateRulesText && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">Rules</p>
              <p className="text-sm whitespace-pre-wrap">{creator.privateRulesText}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Stream History</p>
          {(creator.rooms ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No streams yet.</p>
          ) : (
            <div className="divide-y">
              {creator.rooms.map((room: any) => {
                const roomMeta = [
                  room.category ?? null,
                  room.countryCode ? room.countryCode.toUpperCase() : null,
                  room.startedAt ? new Date(room.startedAt).toLocaleDateString() : null,
                  room.viewerCount > 0 ? `${room.viewerCount} viewers` : null,
                ].filter(Boolean)

                return (
                  <div key={room.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/admin/rooms/${room.id}`}
                        className="text-sm font-medium hover:underline truncate block"
                      >
                        {room.title}
                      </Link>
                      {roomMeta.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">{roomMeta.join(' · ')}</p>
                      )}
                    </div>
                    <StatusBadge status={room.status} />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
