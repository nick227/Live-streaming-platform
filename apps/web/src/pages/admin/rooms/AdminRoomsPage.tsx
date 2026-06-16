import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminEndRoom, useAdminHideRoom, useAdminRooms } from '@streamyolo/sdk'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { AdminListPage } from '@/components/admin/AdminListPage'
import { Button } from '@/components/ui/Button'
import { CheckSquare, EyeOff, LayoutGrid, Square, StopCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const STATUS_FILTERS = [
  { label: 'All', value: 'ALL' },
  { label: 'Live', value: 'LIVE' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Ended', value: 'ENDED' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Removed', value: 'HIDDEN' },
] as const

type StatusFilter = (typeof STATUS_FILTERS)[number]['value']

export function AdminRoomsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const queryStatus = statusFilter === 'ALL' ? undefined : statusFilter
  const { data, isLoading } = useAdminRooms(queryStatus ? { status: queryStatus } : undefined)
  const endRoom = useAdminEndRoom()
  const removeRoom = useAdminHideRoom()
  const items = (data?.data as any[]) ?? []
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const selectedCount = selectedIds.length
  const isMutating = endRoom.isPending || removeRoom.isPending

  function toggleRoom(roomId: string) {
    setSelectedIds((current) =>
      current.includes(roomId) ? current.filter((id) => id !== roomId) : [...current, roomId],
    )
  }

  function toggleVisibleRooms() {
    const visibleIds = items.map((room) => room.id)
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id))
    setSelectedIds(allSelected ? [] : visibleIds)
  }

  async function runRoomAction(
    label: string,
    roomIds: string[],
    action: (roomId: string) => Promise<unknown>,
  ) {
    if (roomIds.length === 0) return
    try {
      await Promise.all(roomIds.map(action))
      setSelectedIds((current) => current.filter((id) => !roomIds.includes(id)))
      toast.success(`${label} ${roomIds.length === 1 ? 'room' : `${roomIds.length} rooms`}`)
    } catch {
      toast.error(`Failed to ${label.toLowerCase()} ${roomIds.length === 1 ? 'room' : 'rooms'}`)
    }
  }

  function handleEnd(roomIds: string[]) {
    if (!confirm(`End ${roomIds.length === 1 ? 'this room' : `${roomIds.length} rooms`}?`)) return
    void runRoomAction('Ended', roomIds, (roomId) => endRoom.mutateAsync({ roomId }))
  }

  function handleRemove(roomIds: string[]) {
    if (!confirm(`Remove ${roomIds.length === 1 ? 'this room' : `${roomIds.length} rooms`} from active room operations?`)) return
    void runRoomAction('Removed', roomIds, (roomId) => removeRoom.mutateAsync({ roomId }))
  }

  const header = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            type="button"
            size="sm"
            variant={statusFilter === filter.value ? 'default' : 'outline'}
            onClick={() => {
              setStatusFilter(filter.value)
              setSelectedIds([])
            }}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          onClick={toggleVisibleRooms}
          disabled={items.length === 0 || isMutating}
        >
          {items.length > 0 && items.every((room) => selectedSet.has(room.id)) ? (
            <CheckSquare className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          {selectedCount > 0 ? `${selectedCount} selected` : 'Select visible rooms'}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={selectedCount === 0 || isMutating}
            loading={endRoom.isPending}
            onClick={() => handleEnd(selectedIds)}
          >
            <StopCircle className="h-4 w-4" />
            End selected
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={selectedCount === 0 || isMutating}
            loading={removeRoom.isPending}
            onClick={() => handleRemove(selectedIds)}
          >
            <Trash2 className="h-4 w-4" />
            Remove selected
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <AdminListPage
      title="Rooms"
      isLoading={isLoading}
      items={items}
      header={header}
      emptyIcon={LayoutGrid}
      emptyTitle="No rooms"
      emptyDescription="Rooms will appear here once created."
      renderItem={(room: any) => (
        <div key={room.id} className="flex items-center justify-between py-3 gap-3">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => toggleRoom(room.id)}
            disabled={isMutating}
            aria-label={selectedSet.has(room.id) ? `Deselect ${room.title}` : `Select ${room.title}`}
          >
            {selectedSet.has(room.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          </button>
          <div className="flex-1 min-w-0">
            <Link to={`/admin/rooms/${room.id}`} className="font-medium hover:underline truncate block">
              {room.title}
            </Link>
            <p className="text-xs text-muted-foreground truncate">
              {room.creator?.displayName ?? room.creator?.user?.displayName ?? 'Unknown creator'} · {room.viewerCount ?? 0} viewers
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={room.status} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-destructive"
              disabled={isMutating || room.status === 'ENDED'}
              onClick={() => handleEnd([room.id])}
            >
              <StopCircle className="h-4 w-4" />
              End
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-destructive"
              disabled={isMutating || room.status === 'HIDDEN'}
              onClick={() => handleRemove([room.id])}
            >
              <EyeOff className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      )}
    />
  )
}
