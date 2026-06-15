import { useCreatorRooms } from '@streamyolo/sdk'
import { RoomCard } from '@/components/rooms/RoomCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Radio } from 'lucide-react'

export function ProfileStreamHistory() {
  const { data, isLoading } = useCreatorRooms({ limit: 12 })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video rounded-lg" />
        ))}
      </div>
    )
  }

  const rooms = (data?.data as Array<Record<string, unknown>>) ?? []

  if (rooms.length === 0) {
    return (
      <EmptyState
        icon={Radio}
        title="No streams yet"
        description="Prepare a room and go live to build your stream history."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {rooms.map((room) => (
        <RoomCard key={room.id as string} room={room as Parameters<typeof RoomCard>[0]['room']} />
      ))}
    </div>
  )
}
