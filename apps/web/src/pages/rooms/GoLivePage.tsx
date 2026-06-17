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
  useUpdateCreatorRoom,
  useRoomTaxonomy,
  useCreatorProfile,
  useUpdateCreatorProfile,
  useCurrentUser,
} from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { LiveRoomLayout } from '@/components/rooms/LiveRoomLayout'
import {
  LiveRoomHeader,
  LiveRoomHeaderMedia,
  liveRoomLinkClassName,
  liveRoomTitleClassName,
} from '@/components/rooms/LiveRoomHeader'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { LiveKitRoom, VideoTrack, useLocalParticipant, useRoomContext } from '@livekit/components-react'
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
  type ChatFilter,
} from '@/components/chat'
import { captureVideoFrameAsFormData } from '@/lib/captureVideoFrame'
import { MAX_ROOM_TAGS } from '@streamyolo/shared/room-taxonomy'

const privatePresets = [
  { label: '5 min - 60 tokens', value: '5:60', minPrivateMinutes: 5, privateRateTokensPerMinute: 60 },
  { label: '5 min - 90 / tokens', value: '5:90', minPrivateMinutes: 5, privateRateTokensPerMinute: 90 },
  { label: '10 min - 60 / tokens', value: '10:60', minPrivateMinutes: 10, privateRateTokensPerMinute: 60 },
  { label: '10 min - 120 / tokens', value: '10:120', minPrivateMinutes: 10, privateRateTokensPerMinute: 120 },
  { label: '15 min - 150 / tokens', value: '15:150', minPrivateMinutes: 15, privateRateTokensPerMinute: 150 },
]

type SelectOption = {
  label: string
  value: string
}

function selectedSummary(options: SelectOption[], selectedValues: string[], fallback: string) {
  const labels = options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label)

  if (labels.length === 0) return fallback
  if (labels.length <= 2) return labels.join(', ')
  return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`
}

function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onToggle,
  placeholder = 'Any',
}: {
  label: string
  options: SelectOption[]
  selectedValues: string[]
  onToggle: (value: string) => void
  placeholder?: string
}) {
  return (
    <details className="relative group">
      <summary className="flex h-9 cursor-pointer list-none items-center justify-between rounded border border-input-border bg-background px-3 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 truncate">{selectedSummary(options, selectedValues, placeholder)}</span>
        <span className="ml-2 text-xs text-muted-foreground group-open:rotate-180">v</span>
      </summary>
      <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded border border-input-border bg-background p-1 shadow-lg">
        {options.map((option) => {
          const active = selectedValues.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={cn(
                'flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-accent',
                active && 'bg-accent text-accent-foreground',
              )}
            >
              <span className="min-w-0 truncate">{option.label}</span>
              {active && <span className="text-xs">On</span>}
            </button>
          )
        })}
      </div>
      <span className="mt-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
    </details>
  )
}

function LabeledSelect({
  id,
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  id: string
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <select
        id={id}
        className="h-9 w-full rounded border border-input-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <label className="mt-1 block text-[11px] font-medium text-muted-foreground" htmlFor={id}>
        {label}
      </label>
    </div>
  )
}

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

function PreviewVideo({
  stream,
  error,
  isFullscreen,
}: {
  stream: MediaStream | null
  error: string | null
  isFullscreen: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
    return () => {
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [stream])

  return (
    <div className={cn('relative bg-black', isFullscreen ? 'w-full h-full' : 'w-full aspect-video')}>
      {(error || !stream) && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
          {error ?? 'Camera connecting...'}
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          'absolute inset-0 block h-full w-full transform scale-x-[-1] bg-black',
          isFullscreen ? 'object-contain' : 'object-cover',
          (error || !stream) && 'hidden',
        )}
      />
    </div>
  )
}

// ─── PublishedTracks ──────────────────────────────────────────────────────────

function PublishPreviewTracks({
  stream,
  isMuted,
  isVideoOff,
  onError,
}: {
  stream: MediaStream | null
  isMuted: boolean
  isVideoOff: boolean
  onError: (message: string) => void
}) {
  const room = useRoomContext()
  const publishedRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!stream || publishedRef.current === stream) return

    // Claim synchronously so a StrictMode remount (or any re-run while async is
    // in-flight) hits the guard above and exits early without re-publishing.
    publishedRef.current = stream

    let cancelled = false
    const videoTrack = stream.getVideoTracks()[0]
    const audioTrack = stream.getAudioTracks()[0]

    async function publish() {
      try {
        if (audioTrack) {
          audioTrack.enabled = !isMuted
          await room.localParticipant.publishTrack(audioTrack, {
            source: Track.Source.Microphone,
            stream: 'camera',
          })
        }
        if (videoTrack) {
          videoTrack.enabled = !isVideoOff
          await room.localParticipant.publishTrack(videoTrack, {
            source: Track.Source.Camera,
            stream: 'camera',
          })
        }
      } catch (err) {
        if (!cancelled) {
          publishedRef.current = null  // allow retry on next stream
          onError(err instanceof Error ? err.message : 'Failed to publish camera')
        }
      }
    }

    void publish()

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, room, onError])

  useEffect(() => {
    const microphone = room.localParticipant.getTrackPublication(Track.Source.Microphone)
    const camera = room.localParticipant.getTrackPublication(Track.Source.Camera)

    if (microphone) {
      void (isMuted ? microphone.mute() : microphone.unmute())
    } else {
      const audioTrack = stream?.getAudioTracks()[0]
      if (audioTrack) audioTrack.enabled = !isMuted
    }

    if (camera) {
      void (isVideoOff ? camera.mute() : camera.unmute())
    } else {
      const videoTrack = stream?.getVideoTracks()[0]
      if (videoTrack) videoTrack.enabled = !isVideoOff
    }
  }, [room, stream, isMuted, isVideoOff])

  return null
}

function PublishedTracks({
  isFullscreen,
  previewStream,
  previewError,
}: {
  isFullscreen: boolean
  previewStream: MediaStream | null
  previewError: string | null
}) {
  const { localParticipant, cameraTrack } = useLocalParticipant()
  const cameraTrackRef = cameraTrack
    ? {
        participant: localParticipant,
        publication: cameraTrack,
        source: Track.Source.Camera,
      }
    : null

  return (
    <div className={cn('relative bg-black', isFullscreen ? 'w-full h-full' : 'w-full aspect-video')}>
      {!cameraTrackRef && (
        <PreviewVideo stream={previewStream} error={previewError} isFullscreen={isFullscreen} />
      )}
      {cameraTrackRef && (
        <VideoTrack
          trackRef={cameraTrackRef}
          muted
          className={cn(
            'absolute inset-0 w-full h-full transform scale-x-[-1]',
            isFullscreen ? 'object-contain' : 'object-cover',
          )}
        />
      )}
    </div>
  )
}

// ─── LiveBroadcast ────────────────────────────────────────────────────────────

function LiveBroadcast({
  token,
  serverUrl,
  onDisconnect,
  isMuted,
  isVideoOff,
  isFullscreen,
  previewStream,
  previewError,
}: {
  token: string
  serverUrl: string
  onDisconnect: () => void
  isMuted: boolean
  isVideoOff: boolean
  isFullscreen: boolean
  previewStream: MediaStream | null
  previewError: string | null
}) {
  const handlePublishError = useCallback((message: string) => {
    toast.error(message)
  }, [])

  return (
    <LiveKitRoom
      video={false}
      audio={false}
      token={token}
      serverUrl={serverUrl}
      options={{ stopLocalTrackOnUnpublish: false }}
      onDisconnected={onDisconnect}
      className={cn('bg-black', isFullscreen ? 'w-full h-full' : 'w-full aspect-video')}
    >
      <PublishPreviewTracks
        stream={previewStream}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        onError={handlePublishError}
      />
      <PublishedTracks
        isFullscreen={isFullscreen}
        previewStream={previewStream}
        previewError={previewError}
      />
    </LiveKitRoom>
  )
}

// ─── AudioWaveform ────────────────────────────────────────────────────────────

function AudioWaveform() {
  const bars = [0.45, 0.85, 0.6]
  return (
    <div className="h-9 w-9 flex items-center justify-center gap-[3px] rounded-full bg-black/50 backdrop-blur-sm">
      {bars.map((heightScale, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full animate-pulse"
          style={{
            height: `${Math.round(heightScale * 18)}px`,
            animationDelay: `${i * 180}ms`,
            backgroundColor: '#ffffff',
            boxShadow: '0 0 6px 2px rgba(255,255,255,0.8)',
          }}
        />
      ))}
    </div>
  )
}

// ─── StateBadge ───────────────────────────────────────────────────────────────

function StateBadge({ state }: { state: BroadcastState }) {
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
  // If state is LIVE_PUBLIC or LIVE_PRIVATE, return null
  // because there is already a clickable LIVE button in the bottom right corner
  return null
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
  canStartBroadcast: boolean
  previewStream: MediaStream | null
  previewError: string | null
}

function VideoContainer({
  state,
  livekitToken,
  livekitUrl,
  isMuted,
  isVideoOff,
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
  canStartBroadcast,
  previewStream,
  previewError,
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
        <PreviewVideo stream={previewStream} error={previewError} isFullscreen={isFullscreen} />
      ) : livekitToken && livekitUrl ? (
        <LiveBroadcast
          token={livekitToken}
          serverUrl={livekitUrl}
          onDisconnect={onDisconnect}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isFullscreen={isFullscreen}
          previewStream={previewStream}
          previewError={previewError}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-black text-white/50 text-sm">
          Loading camera...
        </div>
      )}

      {/* Overlay (auto-hides when live) */}
      <div
        className={cn(
          'absolute inset-0 flex flex-col justify-between pointer-events-none transition-opacity duration-300',
          controlsVisible ? 'opacity-100' : 'opacity-0',
        )}
      >
        {/* Top bar */}
        <div className="flex items-start justify-between p-3 pointer-events-auto">
          <StateBadge state={state} />
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
                  {!isMuted && <AudioWaveform />}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {(state === 'PREVIEW_LOCAL' || state === 'ENDED') && (
                <Button
                  onClick={canStartBroadcast ? onGoLive : undefined}
                  loading={loadingGoLive}
                  disabled={!canStartBroadcast}
                  className={cn(
                    'go-live-indicator font-bold tracking-wide px-6 transition-colors disabled:opacity-100',
                    canStartBroadcast
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-black text-white hover:bg-black',
                  )}
                >
                  {canStartBroadcast ? 'Start Broadcast' : 'Get Ready'}
                </Button>
              )}
              {state === 'STARTING' && (
                <span className="text-white/70 text-sm animate-pulse">Starting broadcast…</span>
              )}
              {isLive && (
                <Button
                  onClick={onEndRoom}
                  loading={loadingEnd}
                  size="sm"
                  className="go-live-indicator bg-red-600 hover:bg-red-700 text-white font-bold tracking-wide"
                >
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  LIVE
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

export function GoLivePage({ studioRoomId }: { studioRoomId?: string } = {}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { roomId: routeRoomId } = useParams<{ roomId: string }>()
  const roomId = studioRoomId ?? routeRoomId
  const { data: roomData } = useRoom(roomId!)
  const room = roomData?.data?.room

  const [state, setState] = useState<BroadcastState>('PREVIEW_LOCAL')
  const broadcastStateRef = useRef<BroadcastState>('PREVIEW_LOCAL')
  useEffect(() => { broadcastStateRef.current = state }, [state])
  const [livekitToken, setLivekitToken] = useState<string | null>(null)
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null)
  const [currentPrivateSession, setCurrentPrivateSession] = useState<any | null>(null)
  const [privateStartedAt, setPrivateStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [eventFilter, setEventFilter] = useState<ChatFilter>('CHAT')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [mutedViewerUserIds, setMutedViewerUserIds] = useState<Set<string>>(() => new Set())
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)

  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editCountryCode, setEditCountryCode] = useState('')
  const [editTagSlugs, setEditTagSlugs] = useState<string[]>([])

  const { data: taxonomyData } = useRoomTaxonomy()
  const taxonomy = taxonomyData?.data
  const updateRoomMutation = useUpdateCreatorRoom()
  const { data: profileData } = useCreatorProfile()
  const updateProfileMutation = useUpdateCreatorProfile()
  const { data: meData } = useCurrentUser()

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((nextStream) => {
        if (cancelled) {
          nextStream.getTracks().forEach((track) => track.stop())
          return
        }
        stream = nextStream
        setPreviewStream(nextStream)
        setPreviewError(null)
      })
      .catch(() => {
        if (!cancelled) setPreviewError('Camera unavailable')
      })

    return () => {
      cancelled = true
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const initializedRef = useRef(false)
  useEffect(() => {
    if (room && !initializedRef.current) {
      initializedRef.current = true
      setEditTitle(room.title || '')
      setEditCategory(room.category ?? '')
      setEditCountryCode(room.countryCode || '')
      setEditTagSlugs(room.tags?.map((t: any) => t.slug) || [])
    }
  }, [room])

  const goLiveMutation = useGoLive()
  const endMutation = useEndRoom()
  const endPrivateMutation = useEndPrivateSession()
  const getLivekitToken = useGetLivekitToken()
  const captureThumbnail = useCaptureRoomThumbnail()

  const fetchedTokenRef = useRef<string | null>(null)
  useEffect(() => {
    if (!room?.id || room.status !== 'LIVE' || fetchedTokenRef.current === room.id) return
    fetchedTokenRef.current = room.id
    getLivekitToken.mutateAsync({ appRoomType: 'PUBLIC_ROOM', appRoomId: room.id })
      .then((res: any) => {
        setLivekitToken(res.data.token)
        setLivekitUrl(res.data.livekitUrl)
        setState('LIVE_PUBLIC')
      })
      .catch((err) => {
        console.error('Failed to pre-fetch livekit token', err)
      })
  // getLivekitToken is a mutation object — new ref every render but stable behavior
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id, room?.status])
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
    queryClient.setQueryData(['creator-profile'], (old: any) => {
      if (!old?.data) return old
      return { ...old, data: { ...old.data, isLive: false, currentRoomId: null } }
    })
    queryClient.invalidateQueries({ queryKey: ['rooms'] })
    queryClient.invalidateQueries({ queryKey: ['creator-profile'] })
    setLivekitToken(null)
    setLivekitUrl(null)
    setCurrentPrivateSession(null)
    setPrivateStartedAt(null)
    setState('PREVIEW_LOCAL')
    navigate(studioRoomId ? '/studio' : `/creator/rooms/${roomId}/go-live`, { replace: true })
  }, [navigate, roomId, queryClient, studioRoomId])
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
  const initialVipUserIds = roomData?.data?.vipUserIds
  const { messages, viewerCount, pinnedMessage, slowModeSeconds, vipUserIds, connected, sending, sendMessage, markMessageDeleted, markUserRewarded } = useRoomSocket(
    roomId,
    initialMessages,
    socketCallbacks,
    { initialVipUserIds },
  )

  const { data: privateReqs } = useCreatorPrivateSessions(roomId!)
  const profile = profileData?.data
  const privateValue = `${profile?.minPrivateMinutes ?? 5}:${profile?.privateRateTokensPerMinute ?? 60}`
  const privateOptions = privatePresets.some((preset) => preset.value === privateValue)
    ? privatePresets
    : [
      {
        label: `${profile?.minPrivateMinutes ?? 5} min - ${profile?.privateRateTokensPerMinute ?? 60} / min`,
        value: privateValue,
        minPrivateMinutes: profile?.minPrivateMinutes ?? 5,
        privateRateTokensPerMinute: profile?.privateRateTokensPerMinute ?? 60,
      },
      ...privatePresets,
    ]

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
  const isLive = state === 'LIVE_PUBLIC' || state === 'LIVE_PRIVATE'
  const isPrivate = state === 'LIVE_PRIVATE'

  useEffect(() => {
    if (!isLive) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isLive])

  const canStartBroadcast = Boolean(
    room?.title?.trim() &&
    room.thumbnailUrl &&
    editCategory &&
    editCountryCode &&
    profile?.status === 'ACTIVE',
  )

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

  async function autosaveRoomDetails(next: {
    title?: string
    category?: string
    countryCode?: string
    tagSlugs?: string[]
  }) {
    if (!room) return
    try {
      await updateRoomMutation.mutateAsync({
        roomId: room.id,
        body: next,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update room')
    }
  }

  function handleTitleBlur() {
    if (!room || room.title === editTitle) return
    void autosaveRoomDetails({ title: editTitle })
  }

  function handleCategoryChange(value: string) {
    setEditCategory(value)
    void autosaveRoomDetails({ category: value })
  }

  function handleCountryChange(value: string) {
    setEditCountryCode(value)
    void autosaveRoomDetails({ countryCode: value })
  }

  function toggleEditTag(slug: string) {
    setEditTagSlugs((current) => {
      if (current.includes(slug)) {
        const next = current.filter((item) => item !== slug)
        void autosaveRoomDetails({ tagSlugs: next })
        return next
      }
      if (current.length >= MAX_ROOM_TAGS) {
        toast.error(`You can select up to ${MAX_ROOM_TAGS} tags`)
        return current
      }
      const next = [...current, slug]
      void autosaveRoomDetails({ tagSlugs: next })
      return next
    })
  }

  async function handlePrivatePresetChange(value: string) {
    const preset = privateOptions.find((option) => option.value === value)
    if (!preset) return
    try {
      await updateProfileMutation.mutateAsync({
        privateRateTokensPerMinute: preset.privateRateTokensPerMinute,
        minPrivateMinutes: preset.minPrivateMinutes,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update private settings')
    }
  }

  // ─── handlers ──────────────────────────────────────────────────────────────

  const handleGoLive = async () => {
    try {
      setState('STARTING')
      const res = await goLiveMutation.mutateAsync(roomId!)
      if (!livekitToken) {
        setLivekitToken((res as any).data.livekitToken)
        setLivekitUrl((res as any).data.livekitUrl)
      }
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
      setLivekitToken(null)
      setLivekitUrl(null)
      setCurrentPrivateSession(null)
      setPrivateStartedAt(null)
      setState('PREVIEW_LOCAL')
      toast.success('Broadcast ended')
    } catch {
      setState('LIVE_PUBLIC')
      toast.error('Failed to end room')
    }
  }

  // LiveKit dropped — clear local video state and let the server's Socket.IO 45s
  // grace timer decide whether to end the room. Calling endRoom here would race
  // against page-refresh cleanup and kill the broadcast before the creator can
  // reconnect.
  const handleDisconnect = useCallback(() => {
    setLivekitToken(null)
    setLivekitUrl(null)
    setCurrentPrivateSession(null)
    setPrivateStartedAt(null)
    setState('PREVIEW_LOCAL')
  }, [])

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

  async function runModeration(label: string, action: () => Promise<unknown>, onSuccess?: () => void) {
    try {
      await action()
      onSuccess?.()
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
        () => setMutedViewerUserIds((prev) => new Set(prev).add(targetUserId)),
      )
    } else if (action === 'unmute') {
      runModeration(
        'Viewer unmuted',
        () => unmuteMutation.mutateAsync(base),
        () =>
          setMutedViewerUserIds((prev) => {
            const next = new Set(prev)
            next.delete(targetUserId)
            return next
          }),
      )
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
        () => markUserRewarded({ type: rewardType, userId: targetUserId }),
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

  const renderChat = () => (
    <CreatorStudioChat
      messages={messages}
      pinnedMessage={pinnedMessage}
      slowModeSeconds={slowModeSeconds}
      mutedUserIds={mutedViewerUserIds}
      vipUserIds={vipUserIds}
      connected={connected}
      sending={sending}
      eventFilter={eventFilter}
      onEventFilterChange={setEventFilter}
      onSend={sendMessage}
      onUserAction={handleUserAction}
      onDeleteMessage={handleDeleteMessage}
      onPinMessage={handlePinMessage}
    />
  )

  const renderViewerRows = () =>
    activeViewers.map((viewer) => (
      <div
        key={viewer.id}
        className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/40"
      >
        <span className="truncate text-sm font-medium">{userLabel(viewer)}</span>
        <ModerationActionBar
          userId={viewer.id}
          isMuted={mutedViewerUserIds.has(viewer.id)}
          isVip={vipUserIds.has(viewer.id)}
          onUserAction={handleUserAction}
        />
      </div>
    ))

  const activeViewersDesktop = activeViewers.length > 0 && (
    <div className="shrink-0 space-y-2 border-t border-border p-3">
      <h2 className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Recent Viewers ({activeViewers.length})
      </h2>
      <div className="max-h-36 space-y-0.5 overflow-y-auto">{renderViewerRows()}</div>
    </div>
  )

  const activeViewersMobile = activeViewers.length > 0 && (
    <div className="space-y-2 rounded-xl border border-border bg-card p-3">
      <h2 className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Recent Viewers ({activeViewers.length})
      </h2>
      <div className="max-h-36 space-y-0.5 overflow-y-auto">{renderViewerRows()}</div>
    </div>
  )

  return (
    <LiveRoomLayout
      header={
        <LiveRoomHeader
          media={
            <LiveRoomHeaderMedia
              src={room.thumbnailUrl}
              alt="Thumbnail"
              onClick={handleCaptureThumbnail}
            />
          }
          title={
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Enter room title..."
              className={liveRoomTitleClassName}
            />
          }
          link={
            meData?.data?.user?.username ? (
              <a
                href={`/${meData.data.user.username}`}
                target="_blank"
                rel="noreferrer"
                className={liveRoomLinkClassName}
              >
                {window.location.origin}/{meData.data.user.username}
              </a>
            ) : null
          }
          status={
            isPrivate
              ? 'Private session active'
              : state === 'LIVE_PUBLIC'
                ? 'Broadcasting live'
                : state === 'STARTING'
                  ? 'Starting broadcast...'
                  : 'Ready to broadcast'
          }
        />
      }
      video={
        <VideoContainer
          state={state}
          livekitToken={livekitToken}
          livekitUrl={livekitUrl}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          containerRef={videoContainerRef}
          onToggleMute={() => setIsMuted((m) => !m)}
          onToggleVideo={() => setIsVideoOff((v) => !v)}
          onGoLive={handleGoLive}
          onEndRoom={handleEndRoom}
          onCaptureThumbnail={handleCaptureThumbnail}
          onDisconnect={handleDisconnect}
          loadingGoLive={goLiveMutation.isPending}
          loadingEnd={endMutation.isPending}
          loadingCapture={captureThumbnail.isPending}
          viewerCount={displayViewerCount}
          canStartBroadcast={canStartBroadcast}
          previewStream={previewStream}
          previewError={previewError}
        />
      }
      controls={
        (state === 'PREVIEW_LOCAL' || state === 'ENDED') && (
          <div className="space-y-3">
            <Button
              variant="default"
              size="lg"
              onClick={handleCaptureThumbnail}
              loading={captureThumbnail.isPending}
              className="flex w-full items-center justify-center gap-2 border-0 bg-gradient-to-r from-blue-600 to-indigo-600 py-6 text-lg font-bold text-white shadow-md transition-all hover:from-blue-700 hover:to-indigo-700"
            >
              <Camera className="h-6 w-6" />
              Capture Room Thumbnail
            </Button>

            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <LabeledSelect
                  id="category"
                  label=""
                  value={editCategory}
                  options={taxonomy?.categories.map((c) => ({ label: c.label, value: c.value })) ?? []}
                  onChange={handleCategoryChange}
                  placeholder="Select"
                />
                <LabeledSelect
                  id="countryCode"
                  label=""
                  value={editCountryCode}
                  options={taxonomy?.countries.map((c) => ({ label: c.name, value: c.code })) ?? []}
                  onChange={handleCountryChange}
                  placeholder="Select"
                />
                <LabeledSelect
                  id="privatePreset"
                  label=""
                  value={privateValue}
                  options={privateOptions.map((p) => ({ label: p.label, value: p.value }))}
                  onChange={handlePrivatePresetChange}
                  placeholder="Private Rate"
                />
                <MultiSelectDropdown
                  label=""
                  options={taxonomy?.tags.map((t) => ({ label: t.label, value: t.slug })) ?? []}
                  selectedValues={editTagSlugs}
                  onToggle={toggleEditTag}
                  placeholder="Tags"
                />
              </div>
            </div>
          </div>
        )
      }
      chat={renderChat}
      sideRailFooter={activeViewersDesktop}
      mobileSideRailFooter={activeViewersMobile}
    >
      {state === 'LIVE_PRIVATE' && currentPrivateSession && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-purple-500/30 bg-purple-950/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-300">Private Session</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-sm">
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{currentPrivateSession.rateTokensPerMinute}</span>{' '}
              tkns/min
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-semibold text-foreground tabular-nums">
                {formatElapsed(elapsedPrivateSeconds)}
              </span>
            </span>
            <span className="text-muted-foreground">
              Captured: <span className="font-semibold text-green-400">{privateCapturedEstimate}</span>
            </span>
            <span className="text-muted-foreground">
              Reserve: <span className="font-semibold text-foreground">{privateBalanceEstimate}</span>
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

      {pendingRequests.length > 0 && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Private Requests ({pendingRequests.length})
          </h2>
          {pendingRequests.map((req: any) => (
            <div
              key={req.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-semibold">{userLabel(req.viewer ?? { id: req.viewerId })}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {req.minMinutes} min at {req.rateTokensPerMinute} tkns/min
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ModerationActionBar
                  userId={req.viewer?.id ?? req.viewerId}
                  isMuted={mutedViewerUserIds.has(req.viewer?.id ?? req.viewerId)}
                  isVip={vipUserIds.has(req.viewer?.id ?? req.viewerId)}
                  onUserAction={handleUserAction}
                />
                <Button size="sm" onClick={() => handleAcceptPrivate(req.id)} loading={acceptMutation.isPending}>
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </LiveRoomLayout>
  )
}
