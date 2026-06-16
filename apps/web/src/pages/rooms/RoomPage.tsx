import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useRoom, useRoomMenu, useRoomMessages } from '@streamyolo/sdk'
import type { components } from '@streamyolo/sdk'
import { Skeleton } from '@/components/ui/Skeleton'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Users, Coins, Lock } from 'lucide-react'
import { ViewerChatPanel, useRoomSocket, type ChatMessageDto } from '@/components/chat'
import { RoomViewerVideo } from '@/components/rooms/RoomViewerVideo'
import { ViewerParticipationPanel } from '@/components/rooms/ViewerParticipationPanel'

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
    </div>
  )
}

export function RoomPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading } = useRoom(slug!)
  const room = data?.data?.room ?? null
  const viewerState = data?.data?.viewerState
  const initialVipUserIds = data?.data?.vipUserIds
  const { data: menuData } = useRoomMenu(room?.id ?? '')
  const { data: msgData } = useRoomMessages(room?.id ?? '')

  const initialMessages = useMemo(
    () => (msgData?.data as ChatMessageDto[] | undefined) ?? [],
    [msgData?.data],
  )
  
  const { 
    messages, 
    viewerCount, 
    pinnedMessage,
    slowModeSeconds,
    vipUserIds,
    connected, 
    sending, 
    sendMessage,
    privateRequestStatus,
    setPrivateRequestStatus
  } = useRoomSocket(
    room?.id,
    initialMessages,
    undefined,
    { initialVipUserIds },
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[500px]">
        <div className="lg:col-span-2 min-h-0">
          <ViewerChatPanel
            messages={messages}
            pinnedMessage={pinnedMessage}
            slowModeSeconds={slowModeSeconds}
            vipUserIds={vipUserIds}
            canChat={viewerState?.canChat ?? true}
            connected={connected}
            sending={sending}
            onSend={sendMessage}
          />
        </div>
        <div className="min-h-0 overflow-y-auto">
          <ViewerParticipationPanel 
            room={room} 
            viewerState={viewerState} 
            menuItems={menuItems}
            privateRequestStatus={privateRequestStatus}
            setPrivateRequestStatus={setPrivateRequestStatus}
          />
        </div>
      </div>
    </div>
  )
}
