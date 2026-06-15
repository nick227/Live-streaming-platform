import { Link } from 'react-router-dom'
import { useAdminRooms } from '@streamyolo/sdk'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { AdminListPage } from '@/components/admin/AdminListPage'
import { LayoutGrid } from 'lucide-react'

export function AdminRoomsPage() {
  const { data, isLoading } = useAdminRooms()
  const items = (data?.data as any[]) ?? []

  return (
    <AdminListPage
      title="Rooms"
      isLoading={isLoading}
      items={items}
      emptyIcon={LayoutGrid}
      emptyTitle="No rooms"
      emptyDescription="Rooms will appear here once created."
      renderItem={(room: any) => (
        <div key={room.id} className="flex items-center justify-between py-3 gap-3">
          <div className="flex-1 min-w-0">
            <Link to={`/admin/rooms/${room.id}`} className="font-medium hover:underline truncate block">
              {room.title}
            </Link>
            <p className="text-xs text-muted-foreground truncate">
              {room.creator?.user?.displayName} · {room.viewerCount ?? 0} viewers
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={room.status} />
            <Link to={`/admin/rooms/${room.id}/end`} className="text-xs text-muted-foreground hover:text-foreground">End</Link>
            <Link to={`/admin/rooms/${room.id}/hide`} className="text-xs text-muted-foreground hover:text-foreground">Hide</Link>
          </div>
        </div>
      )}
    />
  )
}
