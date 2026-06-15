import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface RoomCardProps {
  room: {
    slug: string
    title: string
    status: string
    viewerCount?: number
    thumbnailUrl?: string | null
    creator?: { displayName?: string; avatarUrl?: string | null } | null
  }
}

export function RoomCard({ room }: RoomCardProps) {
  const isLive = room.status === 'LIVE'
  return (
    <Link to={`/rooms/${room.slug}`}>
      <Card className={cn('overflow-hidden transition-all hover:ring-2 hover:ring-primary/40', isLive && 'ring-1 ring-destructive/30')}>
        <div className="relative aspect-video bg-muted">
          {room.thumbnailUrl ? (
            <img src={room.thumbnailUrl} alt={room.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl text-muted-foreground/30">▶</span>
            </div>
          )}
          {isLive && (
            <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded">
              LIVE
            </span>
          )}
          {room.viewerCount !== undefined && isLive && (
            <span className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
              <Users className="h-3 w-3" />
              {room.viewerCount}
            </span>
          )}
        </div>
        <CardContent className="py-3 space-y-0.5">
          <p className="font-medium text-sm line-clamp-1">{room.title}</p>
          {room.creator && (
            <p className="text-xs text-muted-foreground">{room.creator.displayName ?? 'Creator'}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
