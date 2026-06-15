import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useRoom, useRoomMenu, useRoomMessages } from '@streamyolo/sdk'
import type { components } from '@streamyolo/sdk'
import { Skeleton } from '@/components/ui/Skeleton'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Users, Coins, Lock } from 'lucide-react'
import { RoomChatPanel } from '@/components/chat/RoomChatPanel'
import { useRoomSocket } from '@/components/chat/useRoomSocket'
import type { ChatMessageDto } from '@/components/chat/types'
import { RoomViewerVideo } from '@/components/rooms/RoomViewerVideo'

type RoomDetail = components['schemas']['RoomDetail']

function RoomVideoPane({ room, viewerCount }: { room: RoomDetail; viewerCount: number }) {
  const isLive = room.status === 'LIVE'
  return (
    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
      <RoomViewerVideo
        roomId={room.id}
        isLive={isLive}
        fallback={
          <>
            {room.thumbnailUrl ? (
              <img src={room.thumbnailUrl} alt={room.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl text-muted-foreground/20">▶</span>
            )}
          </>
        }
      />
      {isLive && (
        <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded z-10">
          LIVE
        </span>
      )}
      {isLive && (
        <span className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded z-10">
          <Users className="h-3 w-3" />
          {viewerCount}
        </span>
      )}
    </div>
  )
}

function RoomInfoHeader({ room }: { room: RoomDetail }) {
  const isLive = room.status === 'LIVE'
  return (
    <div className="flex items-start gap-3">
      <Avatar src={room.creator?.avatarUrl ?? undefined} name={room.creator?.displayName ?? '?'} size="md" />
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-lg line-clamp-1">{room.title}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">{room.creator?.displayName ?? 'Creator'}</span>
          <StatusBadge status={room.status} />
        </div>
      </div>
      {isLive && (
        <div className="flex gap-2 shrink-0">
          <Button asChild size="sm" variant="outline">
            <Link to={`/rooms/${room.id}/tips`}><Coins className="h-4 w-4 mr-1" />Tip</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/rooms/${room.id}/private-sessions/request`}><Lock className="h-4 w-4 mr-1" />Private</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function RoomTipMenu({ items, roomId }: { items: { id: string; label: string; tokenAmount: number }[]; roomId: string }) {
  if (items.length === 0) return null
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tip Menu</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <Button key={item.id} asChild variant="outline" className="w-full justify-between">
            <Link to={`/rooms/${roomId}/tips`}>
              <span className="text-sm">{item.label}</span>
              <span className="flex items-center gap-1 text-xs text-primary">
                <Coins className="h-3 w-3" />{item.tokenAmount}
              </span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}

export function RoomPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading } = useRoom(slug!)
  const room = data?.data?.room ?? null
  const viewerState = data?.data?.viewerState
  const { data: menuData } = useRoomMenu(room?.id ?? '')
  const { data: msgData } = useRoomMessages(room?.id ?? '')

  const initialMessages = useMemo(
    () => (msgData?.data as ChatMessageDto[] | undefined) ?? [],
    [msgData?.data],
  )
  const { messages, viewerCount, pinnedMessage, connected, sending, sendMessage } = useRoomSocket(
    room?.id,
    initialMessages,
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    )
  }

  if (!room) return <p className="text-muted-foreground">Room not found.</p>

  const menuItems = menuData?.data?.items ?? []
  const displayViewerCount = viewerCount ?? room.viewerCount

  return (
    <div className="space-y-4">
      <RoomVideoPane room={room} viewerCount={displayViewerCount} />
      <RoomInfoHeader room={room} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RoomChatPanel
            messages={messages}
            pinnedMessage={pinnedMessage}
            canChat={viewerState?.canChat ?? true}
            connected={connected}
            sending={sending}
            onSend={sendMessage}
          />
        </div>
        <RoomTipMenu items={menuItems} roomId={room.id} />
      </div>
    </div>
  )
}
