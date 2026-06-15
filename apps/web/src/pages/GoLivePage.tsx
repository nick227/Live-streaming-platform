import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useCaptureRoomThumbnail,
  useCreatorEarnings,
  useRoom,
  useGoLive,
  useEndRoom,
  useEndPrivateSession,
  useGetLivekitToken,
  useRoomMenu,
  useRoomMessages,
  useCreatorPrivateSessions,
  useAcceptPrivateSession,
  useStartPrivateSession,
  useBanCreatorUser,
  useDeleteRoomMessage,
  useKickRoomUser,
  useMuteRoomUser,
  usePinRoomMessage,
  useRewardRoomUser,
  useUnmuteRoomUser,
} from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { io, Socket } from 'socket.io-client'
import { LiveKitRoom, VideoTrack, useTracks, useLocalParticipant } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { Ban, Camera, Coins, Gift, Image, Lock, MessageSquareOff, Pin, ShieldMinus, Timer, Upload, UserMinus, Volume2, VolumeX } from 'lucide-react'

type BroadcastState =
  | 'PREVIEW_LOCAL'
  | 'STARTING'
  | 'LIVE_PUBLIC'
  | 'PRIVATE_PENDING'
  | 'LIVE_PRIVATE'
  | 'ENDING'
  | 'ENDED'

type EventFilter = 'ALL' | 'CHAT' | 'TIPS' | 'PRIVATE' | 'MODERATION' | 'SYSTEM'

function LocalPreview() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((s) => {
      stream = s
      if (videoRef.current) videoRef.current.srcObject = stream
    }).catch((err) => {
      console.error('Failed to get camera', err)
      toast.error('Could not access camera/mic')
    })
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-border flex items-center justify-center">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
      <div className="absolute top-4 left-4 bg-black/60 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
        PREVIEW
      </div>
    </div>
  )
}

function StreamerControls({ onToggleMute, onToggleVideo, isMuted, isVideoOff }: any) {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md">
      <Button variant={isMuted ? 'destructive' : 'outline'} size="sm" onClick={onToggleMute}>
        {isMuted ? 'Unmute' : 'Mute'}
      </Button>
      <Button variant={isVideoOff ? 'destructive' : 'outline'} size="sm" onClick={onToggleVideo}>
        {isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
      </Button>
    </div>
  )
}

function PublishedTracks({ isPrivate }: { isPrivate: boolean }) {
  const { localParticipant } = useLocalParticipant()
  const tracks = useTracks([Track.Source.Camera])

  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)

  const handleToggleMute = () => {
    if (localParticipant) {
      if (isMuted) localParticipant.setMicrophoneEnabled(true)
      else localParticipant.setMicrophoneEnabled(false)
      setIsMuted(!isMuted)
    }
  }

  const handleToggleVideo = () => {
    if (localParticipant) {
      if (isVideoOff) localParticipant.setCameraEnabled(true)
      else localParticipant.setCameraEnabled(false)
      setIsVideoOff(!isVideoOff)
    }
  }

  return (
    <>
      {tracks.map((trackRef) => (
        trackRef.publication.kind === 'video' ? (
          <VideoTrack key={trackRef.publication.trackSid} trackRef={trackRef} className="w-full h-full object-cover transform scale-x-[-1]" />
        ) : null
      ))}
      <div className="absolute top-4 left-4 flex gap-2">
        <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider backdrop-blur-sm ${isPrivate ? 'bg-purple-600 text-white' : 'bg-red-600 text-white'}`}>
          {isPrivate ? 'PRIVATE LIVE' : 'LIVE'}
        </div>
      </div>
      <StreamerControls onToggleMute={handleToggleMute} onToggleVideo={handleToggleVideo} isMuted={isMuted} isVideoOff={isVideoOff} />
    </>
  )
}

function LiveBroadcast({ roomName, token, serverUrl, isPrivate, onDisconnect }: any) {
  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      onDisconnected={onDisconnect}
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-border"
    >
      <PublishedTracks isPrivate={isPrivate} />
    </LiveKitRoom>
  )
}

function userLabel(user: any) {
  return user?.displayName ?? user?.id ?? 'Viewer'
}

function formatElapsed(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getEventFilter(message: any): EventFilter {
  if (message.type === 'TIP_EVENT') return 'TIPS'
  if (message.type === 'PRIVATE_REQUEST') return 'PRIVATE'
  if (message.type === 'MODERATION_EVENT') return 'MODERATION'
  if (message.type === 'SYSTEM_MESSAGE' || message.type === 'AUTO_MESSAGE' || message.type === 'GOAL_EVENT' || message.type === 'MENU_EVENT') return 'SYSTEM'
  return 'CHAT'
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-muted/30 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  )
}

function ModerationButtons({
  userId,
  messageId,
  onUserAction,
  onDeleteMessage,
  onPinMessage,
}: {
  userId?: string
  messageId?: string
  onUserAction: (action: 'mute' | 'unmute' | 'kick' | 'ban' | 'shoutout' | 'vip' | 'unvip', userId: string) => void
  onDeleteMessage?: (messageId: string) => void
  onPinMessage?: (messageId: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {userId && (
        <>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={() => onUserAction('mute', userId)}>
            <VolumeX className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={() => onUserAction('unmute', userId)}>
            <Volume2 className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={() => onUserAction('kick', userId)}>
            <UserMinus className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" size="sm" variant="destructive" className="h-7 px-2" onClick={() => onUserAction('ban', userId)}>
            <Ban className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={() => onUserAction('shoutout', userId)}>
            <Gift className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={() => onUserAction('vip', userId)}>
            VIP
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={() => onUserAction('unvip', userId)}>
            <ShieldMinus className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
      {messageId && onDeleteMessage && (
        <Button type="button" size="sm" variant="destructive" className="h-7 px-2" onClick={() => onDeleteMessage(messageId)}>
          <MessageSquareOff className="h-3.5 w-3.5" />
        </Button>
      )}
      {messageId && onPinMessage && (
        <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={() => onPinMessage(messageId)}>
          <Pin className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}

export function GoLivePage() {
  const navigate = useNavigate()
  const { roomId } = useParams<{ roomId: string }>()
  const { data: roomData } = useRoom(roomId!)
  const room = roomData?.data?.room

  const [state, setState] = useState<BroadcastState>('PREVIEW_LOCAL')
  const [livekitToken, setLivekitToken] = useState<string | null>(null)
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null)
  const [viewerCount, setViewerCount] = useState(0)
  const [currentPrivateSession, setCurrentPrivateSession] = useState<any | null>(null)
  const [privateStartedAt, setPrivateStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [eventFilter, setEventFilter] = useState<EventFilter>('ALL')

  const mutation = useGoLive()
  const endMutation = useEndRoom()
  const endPrivateMutation = useEndPrivateSession()
  const getLivekitToken = useGetLivekitToken()
  const captureThumbnail = useCaptureRoomThumbnail()

  const [socket, setSocket] = useState<Socket | null>(null)
  
  const { data: messagesData } = useRoomMessages(roomId!)
  const [messages, setMessages] = useState<any[]>([])
  const { data: roomMenuData } = useRoomMenu(roomId!)
  const { data: earningsData } = useCreatorEarnings({ limit: 10 })

  const { data: privateReqs } = useCreatorPrivateSessions(roomId!)
  const pendingRequests = privateReqs?.data?.filter((r: any) => r.status === 'REQUESTED') || []
  const goal = (roomMenuData as any)?.data?.goal
  const pendingEarnings = (earningsData as any)?.data?.pendingTokenBalance ?? 0
  
  const acceptMutation = useAcceptPrivateSession()
  const startPrivateMutation = useStartPrivateSession()
  const muteMutation = useMuteRoomUser()
  const unmuteMutation = useUnmuteRoomUser()
  const kickMutation = useKickRoomUser()
  const banMutation = useBanCreatorUser()
  const rewardMutation = useRewardRoomUser()
  const deleteMessageMutation = useDeleteRoomMessage()
  const pinMessageMutation = usePinRoomMessage()

  const viewerMap = new Map<string, any>()
  messages.forEach((message) => {
    if (message.user?.id) viewerMap.set(message.user.id, message.user)
  })
  pendingRequests.forEach((request: any) => {
    const viewer = request.viewer ?? { id: request.viewerId, displayName: request.viewerId }
    if (viewer?.id) viewerMap.set(viewer.id, viewer)
  })
  const activeViewers = Array.from(viewerMap.values())
  const recentTips = messages.filter((message) => message.type === 'TIP_EVENT').slice(-5).reverse()
  const roomTokensEarned = messages.reduce((sum, message) => {
    if (message.type !== 'TIP_EVENT') return sum
    const amount = Number(String(message.body ?? '').match(/\d+/)?.[0] ?? 0)
    return sum + amount
  }, 0)
  const elapsedPrivateSeconds = privateStartedAt ? Math.max(0, Math.floor((now - privateStartedAt) / 1000)) : 0
  const elapsedPrivateMinutes = currentPrivateSession ? Math.max(1, Math.ceil(elapsedPrivateSeconds / 60)) : 0
  const privateCapturedEstimate = currentPrivateSession
    ? Math.min(
        currentPrivateSession.reservedTokens ?? 0,
        elapsedPrivateMinutes * (currentPrivateSession.rateTokensPerMinute ?? 0),
      )
    : 0
  const privateBalanceEstimate = currentPrivateSession
    ? Math.max(0, (currentPrivateSession.reservedTokens ?? 0) - privateCapturedEstimate)
    : 0
  const visibleMessages = messages.filter((message) => eventFilter === 'ALL' || getEventFilter(message) === eventFilter)

  useEffect(() => {
    if (messagesData?.data) {
      setMessages(messagesData.data)
    }
  }, [messagesData])

  useEffect(() => {
    if (state !== 'LIVE_PRIVATE') return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [state])

  useEffect(() => {
    const s = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3001', {
      withCredentials: true,
    })
    
    s.emit('room:join', { roomId })

    s.on('room:viewer_count', (data) => {
      setViewerCount(data.viewerCount)
    })

    s.on('chat:message', (payload) => {
      setMessages((prev) => [...prev, (payload as any).message])
    })

    s.on('tip:created', (payload) => {
      setMessages((prev) => [...prev, (payload as any).message])
      toast.success(`Tip received: ${(payload as any).tip.amountTokens} tokens`)
    })

    s.on('room:message_deleted', (payload) => {
      const messageId = (payload as any).message?.id
      if (messageId) {
        setMessages((prev) => prev.map((message) => message.id === messageId ? { ...message, deletedAt: new Date().toISOString() } : message))
      }
    })

    s.on('room:user_rewarded', (payload) => {
      const rewardType = (payload as any).reward?.type
      if (rewardType === 'VIP') toast.success('Viewer marked VIP')
      if (rewardType === 'UNVIP') toast.success('Viewer removed from VIP')
    })

    setSocket(s)
    return () => {
      s.emit('room:leave', { roomId })
      s.disconnect()
    }
  }, [roomId])

  const handleGoLive = async () => {
    try {
      setState('STARTING')
      const res = await mutation.mutateAsync(roomId!)
      setLivekitToken((res as any).data.livekitToken)
      setLivekitUrl((res as any).data.livekitUrl)
      
      socket?.emit('room:live', { roomId })
      
      setState('LIVE_PUBLIC')
      toast.success("You're live!")
    } catch {
      setState('PREVIEW_LOCAL')
      toast.error('Failed to go live. Ensure admin approval and setup is complete.')
    }
  }

  const handleEndRoom = async () => {
    try {
      setState('ENDING')
      await endMutation.mutateAsync(roomId!)
      setState('ENDED')
      toast.success('Broadcast ended')
      navigate(-1)
    } catch {
      setState('LIVE_PUBLIC')
      toast.error('Failed to end room')
    }
  }

  const handleAcceptPrivate = async (sessionId: string) => {
    try {
      setState('PRIVATE_PENDING')
      await acceptMutation.mutateAsync(sessionId)
      const res = await startPrivateMutation.mutateAsync(sessionId)
      const session = (res as any).data.privateSession
      
      if ((res as any).data.livekitToken) {
         setLivekitToken((res as any).data.livekitToken)
         setLivekitUrl((res as any).data.livekitUrl)
      }
      
      setCurrentPrivateSession(session)
      setPrivateStartedAt(Date.now())
      setState('LIVE_PRIVATE')
      toast.success('Transitioned to Private Session')
    } catch (e) {
      setState('LIVE_PUBLIC')
      toast.error('Failed to accept private session')
    }
  }

  const handleEndPrivate = async () => {
    if (!currentPrivateSession) return
    try {
      await endPrivateMutation.mutateAsync(currentPrivateSession.id)
      const publicToken = await getLivekitToken.mutateAsync({ appRoomType: 'PUBLIC_ROOM', appRoomId: roomId! })
      setLivekitToken((publicToken as any).data.token)
      setLivekitUrl((publicToken as any).data.livekitUrl)
      setCurrentPrivateSession(null)
      setPrivateStartedAt(null)
      setState('LIVE_PUBLIC')
      toast.success('Private session ended')
    } catch {
      toast.error('Failed to end private session')
    }
  }

  const handleCaptureThumbnail = async () => {
    try {
      await captureThumbnail.mutateAsync({ roomId: roomId!, formData: new FormData() })
      toast.success('Thumbnail captured')
    } catch {
      toast.error('Failed to capture thumbnail')
    }
  }

  async function runModeration(label: string, action: () => Promise<unknown>) {
    try {
      await action()
      toast.success(label)
    } catch (error) {
      toast.error((error as Error).message || 'Moderation action failed')
    }
  }

  function handleUserAction(action: 'mute' | 'unmute' | 'kick' | 'ban' | 'shoutout' | 'vip' | 'unvip', targetUserId: string) {
    const base = { roomId: roomId!, targetUserId, reason: 'Live room control' }
    if (action === 'mute') {
      runModeration('Viewer muted', () => muteMutation.mutateAsync({ ...base, durationSeconds: 5 * 60 }))
    } else if (action === 'unmute') {
      runModeration('Viewer unmuted', () => unmuteMutation.mutateAsync(base))
    } else if (action === 'kick') {
      runModeration('Viewer kicked', () => kickMutation.mutateAsync(base))
    } else if (action === 'ban') {
      runModeration('Viewer banned', () => banMutation.mutateAsync(base))
    } else {
      const rewardType = action === 'vip' ? 'VIP' : action === 'unvip' ? 'UNVIP' : 'SHOUTOUT'
      runModeration(action === 'unvip' ? 'VIP removed' : 'Viewer rewarded', () =>
        rewardMutation.mutateAsync({ roomId: roomId!, targetUserId, type: rewardType, note: 'Live room control' }),
      )
    }
  }

  function handleDeleteMessage(messageId: string) {
    runModeration('Message removed', async () => {
      await deleteMessageMutation.mutateAsync({ roomId: roomId!, messageId })
      setMessages((prev) => prev.map((message) => message.id === messageId ? { ...message, deletedAt: new Date().toISOString() } : message))
    })
  }

  function handlePinMessage(messageId: string) {
    runModeration('Message pinned', () => pinMessageMutation.mutateAsync({ roomId: roomId!, messageId }))
  }

  if (!room) return <div className="p-8">Loading room...</div>

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 max-w-7xl mx-auto h-[calc(100vh-8rem)]">
      
      <div className="flex flex-col space-y-4 min-w-0">
        <div className="flex justify-between items-center bg-card p-4 rounded-lg border border-border">
          <div>
            <h1 className="text-xl font-bold">{room.title}</h1>
            <p className="text-sm text-muted-foreground">
              {state === 'LIVE_PRIVATE' ? 'PRIVATE SESSION ACTIVE | public room paused / unavailable' : `State: ${state}`} | Viewers: {viewerCount}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {state === 'PREVIEW_LOCAL' && (
              <Button onClick={handleGoLive} loading={mutation.isPending} className="bg-red-600 hover:bg-red-700 text-white">
                Go Live
              </Button>
            )}
            {(state === 'LIVE_PUBLIC' || state === 'LIVE_PRIVATE') && (
              <Button onClick={handleEndRoom} loading={endMutation.isPending} variant="destructive">
                End Broadcast
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 bg-black rounded-lg">
          {state === 'PREVIEW_LOCAL' || state === 'STARTING' || state === 'ENDED' ? (
             <LocalPreview />
          ) : (
             <LiveBroadcast 
                key={state === 'LIVE_PRIVATE' ? `private-${currentPrivateSession?.id}` : `public-${roomId}`}
                roomName={roomId!} 
                token={livekitToken} 
                serverUrl={livekitUrl} 
                isPrivate={state === 'LIVE_PRIVATE'} 
                onDisconnect={() => setState('ENDED')} 
             />
          )}
        </div>

        {state === 'LIVE_PRIVATE' && currentPrivateSession && (
          <div className="rounded-lg border border-primary bg-primary/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <Lock className="h-4 w-4" />
                  PRIVATE SESSION ACTIVE
                </div>
                <p className="text-sm text-muted-foreground">Public room paused / unavailable</p>
              </div>
              <Button variant="destructive" size="sm" loading={endPrivateMutation.isPending} onClick={handleEndPrivate}>
                End Private
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <Metric label="Rate" value={`${currentPrivateSession.rateTokensPerMinute} / min`} />
              <Metric label="Elapsed" value={formatElapsed(elapsedPrivateSeconds)} />
              <Metric label="Captured" value={`${privateCapturedEstimate} tokens`} />
              <Metric label="Reserve Left" value={`${privateBalanceEstimate} tokens`} />
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Image className="h-4 w-4" />
              Public Thumbnail
            </div>
            <div className="aspect-video overflow-hidden rounded border border-border bg-muted">
              {room.thumbnailUrl ? (
                <img src={room.thumbnailUrl} alt="Current public thumbnail" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No thumbnail</div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" loading={captureThumbnail.isPending} onClick={handleCaptureThumbnail}>
                <Camera className="h-4 w-4" />
                Make current frame thumbnail
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/media/upload">
                  <Upload className="h-4 w-4" />
                  Upload/change cover
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Coins className="h-4 w-4" />
              Room Economy
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Metric label="Room Tips" value={`${roomTokensEarned} tokens`} />
              <Metric label="Pending Requests" value={pendingRequests.length.toString()} />
              <Metric label="Pending Earnings" value={`${pendingEarnings} tokens`} />
              <Metric label="Goal" value={goal ? `${goal.currentTokens}/${goal.targetTokens}` : 'None'} />
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent Tips</h3>
              {recentTips.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tips yet.</p>
              ) : (
                recentTips.map((tip) => (
                  <div key={tip.id} className="flex items-center justify-between rounded border border-border px-2 py-1 text-sm">
                    <span>{userLabel(tip.user)}</span>
                    <span className="font-medium">{tip.body}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-card p-4 rounded-lg border border-border flex-shrink-0">
          <h3 className="font-semibold mb-2">Pending Private Requests ({pendingRequests.length})</h3>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests at the moment.</p>
          ) : (
            <div className="space-y-2">
              {pendingRequests.map((req: any) => (
                <div key={req.id} className="flex flex-wrap justify-between items-center gap-3 bg-muted/50 p-2 rounded border border-border">
                  <div>
                    <span className="font-medium">{userLabel(req.viewer ?? { id: req.viewerId })}</span>
                    <span className="text-xs text-muted-foreground ml-2">({req.minMinutes} mins @ {req.rateTokensPerMinute} tkns/min)</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ModerationButtons userId={req.viewer?.id ?? req.viewerId} onUserAction={handleUserAction} />
                    <Button size="sm" onClick={() => handleAcceptPrivate(req.id)} loading={acceptMutation.isPending}>
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-4 h-full min-h-0">
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/20 font-semibold text-sm uppercase tracking-wide">
            Recent Viewers
          </div>
          <div className="p-3 space-y-2">
            {activeViewers.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">No viewer activity yet...</div>
            ) : (
              activeViewers.map((viewer) => (
                <div key={viewer.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-2 py-2">
                  <span className="text-sm font-medium">{userLabel(viewer)}</span>
                  <ModerationButtons userId={viewer.id} onUserAction={handleUserAction} />
                </div>
              ))
            )}
          </div>
        </div>
        <div className="flex-1 bg-card rounded-lg border border-border flex flex-col overflow-hidden">
          <div className="space-y-3 border-b border-border bg-muted/20 p-3">
            <div className="font-semibold text-sm uppercase tracking-wide">Event Log</div>
            <div className="flex flex-wrap gap-1">
              {(['ALL', 'CHAT', 'TIPS', 'PRIVATE', 'MODERATION', 'SYSTEM'] as EventFilter[]).map((filter) => (
                <Button
                  key={filter}
                  type="button"
                  size="sm"
                  variant={eventFilter === filter ? 'default' : 'outline'}
                  className="h-7 px-2"
                  onClick={() => setEventFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {visibleMessages.length === 0 && <div className="text-sm text-muted-foreground italic">No events yet...</div>}
            {visibleMessages.map((m, i) => (
              <div key={m.id ?? i} className={`rounded border border-border/70 p-2 text-sm ${m.deletedAt ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{userLabel(m.user)}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{getEventFilter(m).toLowerCase()}</span>
                    </div>
                    <div className="mt-1 break-words">{m.deletedAt ? 'Message removed' : (m.body ?? m.text)}</div>
                  </div>
                  {!m.deletedAt && (
                    <ModerationButtons
                      userId={m.user?.id}
                      messageId={m.id}
                      onUserAction={handleUserAction}
                      onDeleteMessage={handleDeleteMessage}
                      onPinMessage={handlePinMessage}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
