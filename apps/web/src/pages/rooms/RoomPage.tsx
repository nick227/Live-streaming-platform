import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRoom, useRoomMenu, useRoomMessages } from '@streamyolo/sdk'
import type { components } from '@streamyolo/sdk'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Users } from 'lucide-react'
import { ViewerChatPanel, useRoomSocket, type ChatMessageDto } from '@/components/chat'
import { LiveRoomLayout } from '@/components/rooms/LiveRoomLayout'
import { RoomViewerVideo } from '@/components/rooms/RoomViewerVideo'
import { AudioOnlyStage } from '@/components/rooms/AudioOnlyStage'
import { ViewerParticipationPanel } from '@/components/rooms/ViewerParticipationPanel'

type RoomDetail = components['schemas']['RoomDetail']

function RoomVideoPane({
  room,
  viewerCount,
  isReconnecting,
  activePrivateSessionId,
}: {
  room: RoomDetail
  viewerCount: number
  isReconnecting: boolean
  activePrivateSessionId: string | null
}) {
  const isLive = room.status === 'LIVE'

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted flex items-center justify-center">
      {room.mediaMode === 'AUDIO_ONLY' ? (
        <AudioOnlyStage
          roomId={room.id}
          isLive={isLive}
          isReconnecting={isReconnecting}
          activePrivateSessionId={activePrivateSessionId}
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
      ) : (
        <RoomViewerVideo
          roomId={room.id}
          isLive={isLive}
          isReconnecting={isReconnecting}
          activePrivateSessionId={activePrivateSessionId}
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
      )}
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
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
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
  const { roomId } = useParams<{ roomId: string }>()
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useRoom(roomId!)

  const room = data?.data?.room
  const initialVipUserIds = data?.data?.vipUserIds
  const [activePrivateSessionId, setActivePrivateSessionId] = useState<string | null>(null)

  useEffect(() => {
    setActivePrivateSessionId((room as any)?.activePrivateSessionId ?? null)
  }, [room?.id, (room as any)?.activePrivateSessionId])

  const { data: menuData } = useRoomMenu(room?.id ?? '')
  const { data: msgData } = useRoomMessages(room?.id ?? '')
  const initialMessages = useMemo(
    () => (msgData?.data as ChatMessageDto[] | undefined) ?? [],
    [msgData?.data],
  )

  const onRoomEnded = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['room', roomId] })
    toast.info('Broadcast ended')
  }, [queryClient, roomId])

  const onActivePrivateStarted = useCallback((payload: { activePrivateSessionId: string }) => {
    setActivePrivateSessionId(payload.activePrivateSessionId)
  }, [])

  const onActivePrivateEnded = useCallback(() => {
    setActivePrivateSessionId(null)
  }, [])

  const [isReconnecting, setIsReconnecting] = useState(false)
  const onRoomReconnecting = useCallback(() => setIsReconnecting(true), [])
  const onRoomReconnected = useCallback(() => setIsReconnecting(false), [])

  const socketCallbacks = useMemo(
    () => ({
      onRoomEnded,
      onActivePrivateStarted,
      onActivePrivateEnded,
      onRoomReconnecting,
      onRoomReconnected,
    }),
    [onRoomEnded, onActivePrivateStarted, onActivePrivateEnded, onRoomReconnecting, onRoomReconnected],
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
  } = useRoomSocket(room?.id, initialMessages, socketCallbacks, { initialVipUserIds })

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto p-4">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    )
  }

  if (isError || !room) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Room Not Found</h2>
        <p className="text-muted-foreground mb-6">This broadcast is no longer available.</p>
        <Button asChild>
          <Link to="/rooms">Back to Browse</Link>
        </Button>
      </div>
    )
  }

  const menuItems = menuData?.data?.items ?? []
  const displayViewerCount = viewerCount ?? room.viewerCount
  const viewerState = {
    canChat: true,
    canTip: true,
    canRequestPrivate: Boolean(room.privateRateTokensPerMinute && room.privateRateTokensPerMinute > 0),
    hasActivePrivateSession: false,
  }

  const renderChat = () => (
    <ViewerChatPanel
      messages={messages}
      pinnedMessage={pinnedMessage}
      slowModeSeconds={slowModeSeconds}
      vipUserIds={vipUserIds}
      canChat={viewerState.canChat}
      connected={connected}
      sending={sending}
      onSend={sendMessage}
    />
  )

  return (
    <LiveRoomLayout
      header={<RoomInfoHeader room={room} />}
      video={
        <RoomVideoPane
          room={room}
          viewerCount={displayViewerCount}
          isReconnecting={isReconnecting}
          activePrivateSessionId={activePrivateSessionId}
        />
      }
      controls={
        <ViewerParticipationPanel
          room={room}
          viewerState={viewerState}
          menuItems={menuItems}
          privateRequestStatus={privateRequestStatus}
        />
      }
      chat={renderChat}
    />
  )
}
