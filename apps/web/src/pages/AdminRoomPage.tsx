import { Link, useParams } from 'react-router-dom'
import { useAdminRoom } from '@streamyolo/sdk'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Avatar } from '@/components/ui/Avatar'

export function AdminRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { data, isLoading } = useAdminRoom(roomId!)

  if (isLoading) return <Skeleton className="h-64 w-full" />

  const room = (data as any)?.data
  if (!room) return <p className="text-muted-foreground">Room not found.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{room.title}</h1>
          <p className="text-sm text-muted-foreground">{room.slug}</p>
        </div>
        <StatusBadge status={room.status} />
      </div>

      {room.thumbnailUrl && (
        <div className="aspect-video rounded-xl overflow-hidden bg-muted">
          <img src={room.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
        </div>
      )}

      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-3">
            <Avatar src={room.creator?.avatarUrl} name={room.creator?.stageName ?? '?'} size="sm" />
            <div>
              <p className="text-sm font-medium">{room.creator?.stageName}</p>
              <p className="text-xs text-muted-foreground">{room.visibility}</p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Viewers</dt>
            <dd>{room.viewerCount ?? 0}</dd>
            <dt className="text-muted-foreground">Rate</dt>
            <dd>{room.privateRateTokensPerMinute} tokens/min</dd>
            <dt className="text-muted-foreground">Min duration</dt>
            <dd>{room.minPrivateMinutes} min</dd>
            {room.startedAt && (
              <>
                <dt className="text-muted-foreground">Started</dt>
                <dd>{new Date(room.startedAt).toLocaleString()}</dd>
              </>
            )}
            {room.endedAt && (
              <>
                <dt className="text-muted-foreground">Ended</dt>
                <dd>{new Date(room.endedAt).toLocaleString()}</dd>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link to={`/admin/rooms/${roomId}/end`}>End Room</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={`/admin/rooms/${roomId}/hide`}>Hide Room</Link>
        </Button>
      </div>
    </div>
  )
}
