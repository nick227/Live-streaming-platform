import { Link } from 'react-router-dom'
import { useCreatorRooms } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Radio, Settings, Shield, Camera } from 'lucide-react'

export function CreatorRoomsPage() {
  const { data, isLoading } = useCreatorRooms()

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
    </div>
  )

  const rooms: any[] = (data?.data as any[]) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">My Rooms</h1>
        <Button asChild size="sm">
          <Link to="/studio">
            <Radio className="h-4 w-4 mr-1.5" />
            New Room
          </Link>
        </Button>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No rooms yet"
          description="Prepare a room to start streaming."
        />
      ) : (
        <div className="divide-y divide-border rounded-xl border">
          {rooms.map((room: any) => (
            <div key={room.id} className="flex items-center gap-3 px-4 py-3">
              {room.thumbnailUrl ? (
                <img src={room.thumbnailUrl} alt={room.title} className="w-16 h-10 rounded object-cover shrink-0 bg-muted" />
              ) : (
                <div className="w-16 h-10 rounded bg-muted shrink-0 flex items-center justify-center">
                  <Radio className="h-4 w-4 text-muted-foreground/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">{room.title}</p>
                  <StatusBadge status={room.status} />
                </div>
                <p className="text-xs text-muted-foreground">{room.slug}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {room.status === 'LIVE' && (
                  <Button asChild variant="ghost" size="sm" title="Moderation">
                    <Link to={`/creator/rooms/${room.id}/moderation`}>
                      <Shield className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {(room.status === 'DRAFT' || room.status === 'ENDED') && (
                  <Button asChild variant="ghost" size="sm" title="Go Live">
                    <Link to="/studio" state={{ roomId: room.id }}>
                      <Radio className="h-4 w-4 text-primary" />
                    </Link>
                  </Button>
                )}
                <Button asChild variant="ghost" size="sm" title="Setup">
                  <Link to="/studio" state={{ roomId: room.id }}>
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
                {!room.thumbnailUrl && (
                  <Button asChild variant="ghost" size="sm" title="Capture Thumbnail">
                    <Link to={`/rooms/${room.id}/thumbnail/capture`}>
                      <Camera className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
