import { useMemo, useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useUserChannel, useRoomMenu, useRoomMessages } from '@streamyolo/sdk'
import type { components } from '@streamyolo/sdk'
import { Skeleton } from '@/components/ui/Skeleton'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Users, AlertTriangle } from 'lucide-react'
import { ViewerChatPanel, useRoomSocket, type ChatMessageDto } from '@/components/chat'
import { RoomViewerVideo } from '@/components/rooms/RoomViewerVideo'
import { ViewerParticipationPanel } from '@/components/rooms/ViewerParticipationPanel'

type RoomDetail = components['schemas']['RoomDetail']
type PublicUser = components['schemas']['PublicUser']
type CreatorSummary = components['schemas']['CreatorSummary']

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
    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
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
    <div className="flex items-start gap-3 py-4 border-b border-border/50">
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

function OfflineProfileView({ user, creator }: { user: PublicUser; creator?: CreatorSummary }) {
  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <Avatar src={creator?.avatarUrl ?? undefined} name={user.displayName} size="xl" className="h-32 w-32" />
        <div>
          <h1 className="text-3xl font-bold">{user.displayName}</h1>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-muted-foreground"></span>
          Offline
        </div>
      </div>

      {creator?.bio && (
        <div className="bg-card border border-border/50 p-6 rounded-lg text-center">
          <p className="whitespace-pre-wrap">{creator.bio}</p>
        </div>
      )}

      {creator?.privateRateTokensPerMinute && creator.privateRateTokensPerMinute > 0 && (
        <div className="bg-muted/50 p-6 rounded-lg border border-border/50">
          <h3 className="font-semibold mb-2">Private Sessions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Available for {creator.privateRateTokensPerMinute} tokens/min (min {creator.minPrivateMinutes} mins).
          </p>
          {creator.privateRulesText && (
            <div className="text-sm border-t border-border pt-4">
              <span className="font-medium text-foreground">Rules:</span> {creator.privateRulesText}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-center gap-4 pt-4 border-t border-border/50">
        <Button variant="outline" asChild>
          <Link to="/rooms">Back to Browse</Link>
        </Button>
        <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Report User
        </Button>
      </div>
    </div>
  )
}

export function UserChannelPage() {
  const { username } = useParams<{ username: string }>()
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useUserChannel(username!)
  
  const user = data?.data?.user
  const creator = data?.data?.creator
  const room = data?.data?.room ?? null
  const viewerState = data?.data?.viewerState
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
    queryClient.invalidateQueries({ queryKey: ['userChannel', username] })
  }, [queryClient, username])

  const onRoomStarted = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['userChannel', username] })
    toast.success('Broadcast has started')
  }, [queryClient, username])

  const onMessagePinned = useCallback(() => {
    toast.success('Message pinned')
  }, [])

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
      onRoomStarted,
      onMessagePinned,
      onActivePrivateStarted,
      onActivePrivateEnded,
      onRoomReconnecting,
      onRoomReconnected,
    }),
    [
      onRoomEnded,
      onRoomStarted,
      onMessagePinned,
      onActivePrivateStarted,
      onActivePrivateEnded,
      onRoomReconnecting,
      onRoomReconnected,
    ],
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
    socketCallbacks,
    { initialVipUserIds },
  )

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto p-4">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Channel Not Found</h2>
        <p className="text-muted-foreground mb-6">The user you are looking for doesn't exist.</p>
        <Button asChild><Link to="/rooms">Back to Browse</Link></Button>
      </div>
    )
  }

  const isLive = room?.status === 'LIVE'

  if (!isLive || !room) {
    return <OfflineProfileView user={user} creator={creator ?? undefined} />
  }

  const menuItems = menuData?.data?.items ?? []
  const displayViewerCount = viewerCount ?? room.viewerCount

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto p-4">
      <RoomVideoPane
        room={room}
        viewerCount={displayViewerCount}
        isReconnecting={isReconnecting}
        activePrivateSessionId={activePrivateSessionId}
      />
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
