import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRooms } from '@streamyolo/sdk'
import { RoomCard } from '@/components/rooms/RoomCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Radio, Plus } from 'lucide-react'

export function RoomsPage() {
  const [q, setQ] = useState('')
  const { data, isLoading } = useRooms(q ? { q } : undefined)

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-video rounded-lg" />)}
      </div>
    </div>
  )

  const rooms = (data?.data as any[]) ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search live rooms..."
          className="flex-1"
        />
        <Button asChild size="md" variant="outline">
          <Link to="/creator/rooms/prepare">
            <Plus className="h-4 w-4 mr-1" />
            New Room
          </Link>
        </Button>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No live rooms right now"
          description="Check back soon or start your own stream."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room: any) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  )
}
