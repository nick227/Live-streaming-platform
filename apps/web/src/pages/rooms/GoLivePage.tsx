import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  useCaptureRoomThumbnail,
  useRoom,
  useGoLive,
  useEndRoom,
  useEndPrivateSession,
  useGetLivekitToken,
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
import { cn } from '@/lib/utils'
import { LiveKitRoom, VideoTrack, useTracks, useLocalParticipant } from '@livekit/components-react'
import { Track } from 'livekit-client'
import {
  Camera,
  Clock,
  Lock,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Users,
  Video,
  VideoOff,
} from 'lucide-react'
import {
  CreatorStudioChat,
  ModerationActionBar,
  useRoomSocket,
  userLabel,
  type ChatMessageDto,
  type EventFilter,
  type RoomEvent,
} from '@/components/chat'
import { captureVideoFrameAsFormData } from '@/lib/captureVideoFrame'

// ─── types ────────────────────────────────────────────────────────────────────

type BroadcastState =
  | 'PREVIEW_LOCAL'
  | 'STARTING'
  | 'LIVE_PUBLIC'
  | 'PRIVATE_PENDING'
  | 'LIVE_PRIVATE'
  | 'ENDING'
  | 'ENDED'

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatElapsed(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function privateRequestViewer(request: any) {
  return request.viewer ?? { id: request.viewerId, displayName: request.viewerId }
}

// ─── LocalPreview ─────────────────────────────────────────────────────────────

function LocalPreview({ isFullscreen }: { isFullscreen: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        stream = s
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch((err) => {
        console.error('Failed to get camera', err)
        toast.error('Could not access camera/mic')
      })
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={cn(
        'block transform scale-x-[-1] bg-black',
        isFullscreen ? 'w-full h-full object-contain' : 'w-full',
      )}
    />
  )
}

// ─── PublishedTracks ──────────────────────────────────────────────────────────

function PublishedTracks({
  isPrivate,
  isMuted,
  isVideoOff,
  isFullscreen,
}: {
  isPrivate: boolean
  isMuted: boolean
  isVideoOff: boolean
  isFullscreen: boolean
}) {
  const { localParticipant } = useLocalParticipant()
  const tracks = useTracks([Track.Source.Camera])

  useEffect(() => {
    if (localParticipant) localParticipant.setMicrophoneEnabled(!isMuted).catch(() => {})
  }, [isMuted, localParticipant])

  useEffect(() => {
    if (localParticipant) localParticipant.setCameraEnabled(!isVideoOff).catch(() => {})
  }, [isVideoOff, localParticipant])

  return (
    <div className={cn('relative bg-black', isFullscreen ? 'w-full h-full' : 'w-full aspect-video')}>
      {tracks.map((trackRef) =>
        trackRef.publication.kind === 'video' ? (
          <VideoTrack
            key={trackRef.publication.trackSid}
            trackRef={trackRef}
            className={cn(
              'absolute inset-0 w-full h-full',
              isFullscreen ? 'object-contain' : 'object-cover',
            )}
          />
        ) : null,
      )}
      {isPrivate && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-purple-700/90 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none">
          <Lock className="h-3 w-3" /> PRIVATE
        </div>
      )}
    </div>
  )
}

// ─── LiveBroadcast ────────────────────────────────────────────────────────────

function LiveBroadcast({
  token,
  serverUrl,
  isPrivate,
  onDisconnect,
  isMuted,
  isVideoOff,
  isFullscreen,
}: {
  token: string
  serverUrl: string
  isPrivate: boolean
  onDisconnect: () => void
  isMuted: boolean
  isVideoOff: boolean
  isFullscreen: boolean
}) {
  return (
    <LiveKitRoom
      video
      audio
      token={token}
      serverUrl={serverUrl}
      onDisconnected={onDisconnect}
      className={cn('bg-black', isFullscreen ? 'w-full h-full' : 'w-full aspect-video')}
    >
      <PublishedTracks
        isPrivate={isPrivate}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isFullscreen={isFullscreen}
      />
    </LiveKitRoom>
  )
}

// ─── StateBadge ───────────────────────────────────────────────────────────────

function StateBadge({ state, isPrivate }: { state: BroadcastState; isPrivate: boolean }) {
  if (state === 'STARTING') {
    return (
      <span className="flex items-center gap-1.5 bg-black/60 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
        Starting…
      </span>
    )
  }
  if (state === 'PREVIEW_LOCAL' || state === 'ENDED') {
    return (
      <span className="flex items-center gap-1.5 bg-black/60 text-white/70 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm uppercase tracking-wider">
        Preview
      </span>
    )
  }
  if (isPrivate) {
    return (
      <span className="flex items-center gap-1.5 bg-purple-700/90 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
        <Lock className="h-3 w-3" /> Private
      </span>
    )
  }
  return (
    <span className="flex items-center gap-2 bg-red-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      LIVE
    </span>
  )
}

// ─── IconControlButton ────────────────────────────────────────────────────────

function IconControlButton({
  onClick,
  active,
  title,
  disabled,
  children,
}: {
  onClick: () => void
  active?: boolean
  title?: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        'h-9 w-9 flex items-center justify-center rounded-full transition-all select-none',
        active
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-black/50 text-white hover:bg-black/75 backdrop-blur-sm',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  )
}

// ─── VideoContainer ───────────────────────────────────────────────────────────

interface VideoContainerProps {
  state: BroadcastState
  livekitToken: string | null
  livekitUrl: string | null
  isMuted: boolean
  isVideoOff: boolean
  isPrivate: boolean
  containerRef: React.RefObject<HTMLDivElement>
  onToggleMute: () => void
  onToggleVideo: () => void
  onGoLive: () => void
  onEndRoom: () => void
  onCaptureThumbnail: () => void
  onDisconnect: () => void
  loadingGoLive: boolean
  loadingEnd: boolean
  loadingCapture: boolean
  viewerCount: number
}

function VideoContainer({
  state,
  livekitToken,
  livekitUrl,
  isMuted,
  isVideoOff,
  isPrivate,
  containerRef,
  onToggleMute,
  onToggleVideo,
  onGoLive,
  onEndRoom,
  onCaptureThumbnail,
  onDisconnect,
  loadingGoLive,
  loadingEnd,
  loadingCapture,
  viewerCount,
}: VideoContainerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const isLive = state === 'LIVE_PUBLIC' || state === 'LIVE_PRIVATE'

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000)
  }, [])

  const handleMouseMove = useCallback(() => {
    setControlsVisible(true)
    if (isLive) scheduleHide()
  }, [isLive, scheduleHide])

  const handleMouseLeave = useCallback(() => {
    if (isLive) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), 800)
    }
  }, [isLive])

  useEffect(() => {
    if (!isLive) {
      setControlsVisible(true)
      clearTimeout(hideTimerRef.current)
    } else {
      scheduleHide()
    }
    return () => clearTimeout(hideTimerRef.current)
  }, [isLive, scheduleHide])

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [isFullscreen, containerRef])

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-black',
        isFullscreen && 'h-screen rounded-none border-none',
      )}
    >
      {/* Video */}
      {state === 'PREVIEW_LOCAL' || state === 'STARTING' || state === 'ENDED' ? (
        <LocalPreview isFullscreen={isFullscreen} />
      ) : livekitToken && livekitUrl ? (
        <LiveBroadcast
          key={isPrivate ? 'private' : 'public'}
          token={livekitToken}
          serverUrl={livekitUrl}
          isPrivate={isPrivate}
          onDisconnect={onDisconnect}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isFullscreen={isFullscreen}
        />
      ) : null}

      {/* Overlay (auto-hides when live) */}
      <div
        className={cn(
          'absolute inset-0 flex flex-col justify-between pointer-events-none transition-opacity duration-300',
          controlsVisible ? 'opacity-100' : 'opacity-0',
        )}
      >
        {/* Top bar */}
        <div className="flex items-start justify-between p-3 pointer-events-auto">
          <StateBadge state={state} isPrivate={isPrivate} />
          <div className="flex items-center gap-1 rounded-full bg-black/50 p-1 text-white backdrop-blur-sm">
            <span className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold tabular-nums">
              <Users className="h-3.5 w-3.5" />
              {viewerCount}
            </span>
            <IconControlButton
              onClick={onCaptureThumbnail}
              title="Capture thumbnail"
              disabled={loadingCapture}
            >
              <Camera className="h-4 w-4" />
            </IconControlButton>
            <IconControlButton
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </IconControlButton>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-14 p-4 pointer-events-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              {isLive && (
                <>
                  <IconControlButton
                    onClick={onToggleMute}
                    active={isMuted}
                    title={isMuted ? 'Unmute mic' : 'Mute mic'}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </IconControlButton>
                  <IconControlButton
                    onClick={onToggleVideo}
                    active={isVideoOff}
                    title={isVideoOff ? 'Enable camera' : 'Disable camera'}
                  >
                    {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  </IconControlButton>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {state === 'PREVIEW_LOCAL' && (
                <Button
                  onClick={onGoLive}
                  loading={loadingGoLive}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold tracking-wide px-6"
                >
                  ● Go Live
                </Button>
              )}
              {state === 'STARTING' && (
                <span className="text-white/70 text-sm animate-pulse">Starting broadcast…</span>
              )}
              {isLive && (
                <Button
                  onClick={onEndRoom}
                  loading={loadingEnd}
                  variant="destructive"
                  size="sm"
                  className="font-bold"
                >
                  End Broadcast
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── GoLivePage ───────────────────────────────────────────────────────────────

export function GoLivePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { roomId } = useParams<{ roomId: string }>()
  const { data: roomData } = useRoom(roomId!)
  const room = roomData?.data?.room

  const [state, setState] = useState<BroadcastState>('PREVIEW_LOCAL')
  const [livekitToken, setLivekitToken] = useState<string | null>(null)
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null)
  const [currentPrivateSession, setCurrentPrivateSession] = useState<any | null>(null)
  const [privateStartedAt, setPrivateStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [eventFilter, setEventFilter] = useState<EventFilter>('ALL')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const videoContainerRef = useRef<HTMLDivElement>(null)

  const goLiveMutation = useGoLive()
  const endMutation = useEndRoom()
  const endPrivateMutation = useEndPrivateSession()
  const getLivekitToken = useGetLivekitToken()
  const captureThumbnail = useCaptureRoomThumbnail()
  const acceptMutation = useAcceptPrivateSession()
  const startPrivateMutation = useStartPrivateSession()
  const muteMutation = useMuteRoomUser()
  const unmuteMutation = useUnmuteRoomUser()
  const kickMutation = useKickRoomUser()
  const banMutation = useBanCreatorUser()
  const rewardMutation = useRewardRoomUser()
  const deleteMessageMutation = useDeleteRoomMessage()
  const pinMessageMutation = usePinRoomMessage()

  const { data: messagesData } = useRoomMessages(roomId!)
  const initialMessages = useMemo(
    () => (messagesData?.data as ChatMessageDto[] | undefined) ?? [],
    [messagesData?.data],
  )

  const onTipCreated = useCallback((payload: { tip: { amountTokens: number } }) => {
    toast.success(`Tip received: ${payload.tip.amountTokens} tokens`)
  }, [])
  const onUserRewarded = useCallback((payload: { reward: { type: string } }) => {
    if (payload.reward.type === 'VIP') toast.success('Viewer marked VIP')
    if (payload.reward.type === 'UNVIP') toast.success('Viewer removed from VIP')
  }, [])
  const onPrivateRequestCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['creator-private-sessions', roomId] })
    toast.info('New private session request')
  }, [queryClient, roomId])
  const onRoomEnded = useCallback(() => {
    toast.info('Broadcast ended')
    setState('ENDED')
    navigate(-1)
  }, [navigate])
  const onMessagePinned = useCallback(() => {
    toast.success('Message pinned')
  }, [])

  const socketCallbacks = useMemo(
    () => ({
      onTipCreated,
      onUserRewarded,
      onPrivateRequestCreated,
      onRoomEnded,
      onMessagePinned,
    }),
    [onTipCreated, onUserRewarded, onPrivateRequestCreated, onRoomEnded, onMessagePinned],
  )
  const { messages, viewerCount, pinnedMessage, markMessageDeleted } = useRoomSocket(
    roomId,
    initialMessages,
    socketCallbacks,
  )

  const { data: privateReqs } = useCreatorPrivateSessions(roomId!)

  const { activeViewers, pendingRequests } = useMemo(() => {
    const viewerMap = new Map<string, any>()

    for (const event of messages) {
      const user = event.message.user
      if (user?.id) viewerMap.set(user.id, user)
    }

    const requests = []
    for (const request of privateReqs?.data ?? []) {
      if ((request as any).status !== 'REQUESTED') continue
      requests.push(request)

      const viewer = privateRequestViewer(request)
      if (viewer?.id) viewerMap.set(viewer.id, viewer)
    }

    return {
      activeViewers: Array.from(viewerMap.values()),
      pendingRequests: requests,
    }
  }, [messages, privateReqs?.data])
  const displayViewerCount = viewerCount ?? room?.viewerCount ?? 0
  const isPrivate = state === 'LIVE_PRIVATE'

  const elapsedPrivateSeconds = privateStartedAt
    ? Math.max(0, Math.floor((now - privateStartedAt) / 1000))
    : 0
  const elapsedPrivateMinutes = currentPrivateSession
    ? Math.max(1, Math.ceil(elapsedPrivateSeconds / 60))
    : 0
  const privateCapturedEstimate = currentPrivateSession
    ? Math.min(
        currentPrivateSession.reservedTokens ?? 0,
        elapsedPrivateMinutes * (currentPrivateSession.rateTokensPerMinute ?? 0),
      )
    : 0
  const privateBalanceEstimate = currentPrivateSession
    ? Math.max(0, (currentPrivateSession.reservedTokens ?? 0) - privateCapturedEstimate)
    : 0

  useEffect(() => {
    if (state !== 'LIVE_PRIVATE') return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [state])

  // ─── handlers ──────────────────────────────────────────────────────────────

  const handleGoLive = async () => {
    try {
      setState('STARTING')
      const res = await goLiveMutation.mutateAsync(roomId!)
      setLivekitToken((res as any).data.livekitToken)
      setLivekitUrl((res as any).data.livekitUrl)
      setState('LIVE_PUBLIC')
      toast.success("You're live!")
    } catch (err) {
      setState('PREVIEW_LOCAL')
      const msg = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Failed to go live: ${msg}`)
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
      toast.success('Private session started')
    } catch {
      setState('LIVE_PUBLIC')
      toast.error('Failed to accept private session')
    }
  }

  const handleEndPrivate = async () => {
    if (!currentPrivateSession) return
    try {
      await endPrivateMutation.mutateAsync(currentPrivateSession.id)
      const publicToken = await getLivekitToken.mutateAsync({
        appRoomType: 'PUBLIC_ROOM',
        appRoomId: roomId!,
      })
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
    const video = videoContainerRef.current?.querySelector('video')
    if (!video) {
      toast.error('No camera feed to capture')
      return
    }
    try {
      const formData = await captureVideoFrameAsFormData(video)
      await captureThumbnail.mutateAsync({ roomId: roomId!, formData })
      toast.success('Thumbnail captured')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to capture thumbnail')
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

  function handleUserAction(
    action: 'mute' | 'unmute' | 'kick' | 'ban' | 'shoutout' | 'vip' | 'unvip',
    targetUserId: string,
  ) {
    const base = { roomId: roomId!, targetUserId, reason: 'Live room control' }
    if (action === 'mute') {
      runModeration('Viewer muted', () =>
        muteMutation.mutateAsync({ ...base, durationSeconds: 5 * 60 }),
      )
    } else if (action === 'unmute') {
      runModeration('Viewer unmuted', () => unmuteMutation.mutateAsync(base))
    } else if (action === 'kick') {
      runModeration('Viewer kicked', () => kickMutation.mutateAsync(base))
    } else if (action === 'ban') {
      runModeration('Viewer banned', () => banMutation.mutateAsync(base))
    } else {
      const rewardType = action === 'vip' ? 'VIP' : action === 'unvip' ? 'UNVIP' : 'SHOUTOUT'
      runModeration(action === 'unvip' ? 'VIP removed' : 'Viewer rewarded', () =>
        rewardMutation.mutateAsync({
          roomId: roomId!,
          targetUserId,
          type: rewardType,
          note: 'Live room control',
        }),
      )
    }
  }

  function handleDeleteMessage(messageId: string) {
    runModeration('Message removed', async () => {
      await deleteMessageMutation.mutateAsync({ roomId: roomId!, messageId })
      markMessageDeleted(messageId)
    })
  }

  function handlePinMessage(messageId: string) {
    runModeration('Message pinned', () =>
      pinMessageMutation.mutateAsync({ roomId: roomId!, messageId }),
    )
  }

  if (!room) {
    return <div className="p-8 text-muted-foreground animate-pulse">Loading studio…</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-4 xl:gap-6 items-start">

      {/* ── Left column ── */}
      <div className="flex flex-col gap-4">

        {/* Room header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight truncate">{room.title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isPrivate
                ? 'Private session active — public room paused'
                : state === 'LIVE_PUBLIC'
                  ? 'Broadcasting live'
                  : state === 'STARTING'
                    ? 'Starting broadcast…'
                    : 'Ready to broadcast'}
            </p>
          </div>
        </div>

        {/* Thumbnail hint — show when previewing and no thumbnail yet */}
        {state === 'PREVIEW_LOCAL' && !room.thumbnailUrl && (
          <p className="text-xs text-muted-foreground">
            No thumbnail yet — use the <Camera className="inline h-3.5 w-3.5" /> button in the video overlay to capture one.
          </p>
        )}

        {/* Video with floating controls */}
        <VideoContainer
          state={state}
          livekitToken={livekitToken}
          livekitUrl={livekitUrl}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isPrivate={isPrivate}
          containerRef={videoContainerRef}
          onToggleMute={() => setIsMuted((m) => !m)}
          onToggleVideo={() => setIsVideoOff((v) => !v)}
          onGoLive={handleGoLive}
          onEndRoom={handleEndRoom}
          onCaptureThumbnail={handleCaptureThumbnail}
          onDisconnect={() => setState('ENDED')}
          loadingGoLive={goLiveMutation.isPending}
          loadingEnd={endMutation.isPending}
          loadingCapture={captureThumbnail.isPending}
          viewerCount={displayViewerCount}
        />

        {/* Private session status bar */}
        {state === 'LIVE_PRIVATE' && currentPrivateSession && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-purple-500/30 bg-purple-950/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-300">Private Session</span>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-sm">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {currentPrivateSession.rateTokensPerMinute}
                </span>{' '}
                tkns/min
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground tabular-nums">
                  {formatElapsed(elapsedPrivateSeconds)}
                </span>
              </span>
              <span className="text-muted-foreground">
                Captured:{' '}
                <span className="font-semibold text-green-400">{privateCapturedEstimate}</span>
              </span>
              <span className="text-muted-foreground">
                Reserve:{' '}
                <span className="font-semibold text-foreground">{privateBalanceEstimate}</span>
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              loading={endPrivateMutation.isPending}
              onClick={handleEndPrivate}
            >
              End Private
            </Button>
          </div>
        )}

        {/* Pending private requests */}
        {pendingRequests.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Private Requests ({pendingRequests.length})
            </h2>
            {pendingRequests.map((req: any) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/30 border border-border px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {userLabel(req.viewer ?? { id: req.viewerId })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {req.minMinutes} min · {req.rateTokensPerMinute} tkns/min
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ModerationActionBar
                    userId={req.viewer?.id ?? req.viewerId}
                    onUserAction={handleUserAction}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAcceptPrivate(req.id)}
                    loading={acceptMutation.isPending}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right column: chat + viewers ── */}
      <div className="flex flex-col gap-4 xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)] xl:overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col">
          <CreatorStudioChat
            messages={messages}
            pinnedMessage={pinnedMessage}
            eventFilter={eventFilter}
            onEventFilterChange={setEventFilter}
            onUserAction={handleUserAction}
            onDeleteMessage={handleDeleteMessage}
            onPinMessage={handlePinMessage}
          />
        </div>

        {activeViewers.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-3 space-y-2 shrink-0">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Recent Viewers ({activeViewers.length})
            </h2>
            <div className="space-y-0.5 max-h-36 overflow-y-auto">
              {activeViewers.map((viewer) => (
                <div
                  key={viewer.id}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40 transition-colors"
                >
                  <span className="text-sm font-medium truncate">{userLabel(viewer)}</span>
                  <ModerationActionBar userId={viewer.id} onUserAction={handleUserAction} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
