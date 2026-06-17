import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCurrentUser, useEndPrivateSession, useStartPrivateSession } from '@streamyolo/sdk'
import type { components } from '@streamyolo/sdk'
import { LiveKitRoom, VideoTrack, useTracks, AudioTrack, useLocalParticipant } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { Loader2, MonitorUp, PhoneOff } from 'lucide-react'

type PrivateSessionDto = components['schemas']['PrivateSessionDto']

function CountdownTimer({ hardEndAt }: { hardEndAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const end = new Date(hardEndAt).getTime()
    const interval = setInterval(() => {
      const now = Date.now()
      const remainingMs = end - now
      if (remainingMs <= 0) {
        setTimeLeft('00:00')
        clearInterval(interval)
      } else {
        const mins = Math.floor(remainingMs / 60000)
        const secs = Math.floor((remainingMs % 60000) / 1000)
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [hardEndAt])

  return (
    <div className="font-mono text-xl font-bold bg-black/60 px-4 py-2 rounded-lg text-white backdrop-blur-md">
      {timeLeft || '--:--'}
    </div>
  )
}

function PublishedTracks() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone, Track.Source.ScreenShare])
  const { localParticipant } = useLocalParticipant()

  // Find remote tracks
  const remoteVideoTracks = tracks.filter((t) => (t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare) && t.participant.identity !== localParticipant.identity)
  const remoteAudioTracks = tracks.filter((t) => t.source === Track.Source.Microphone && t.participant.identity !== localParticipant.identity)

  // Find local tracks
  const localVideoTrack = tracks.find((t) => t.source === Track.Source.Camera && t.participant.identity === localParticipant.identity)

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">
      {remoteVideoTracks.map((tr) => (
        <VideoTrack
          key={tr.participant.identity}
          trackRef={tr}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ))}
      
      {remoteAudioTracks.map((tr) => (
        <AudioTrack key={tr.participant.identity} trackRef={tr} />
      ))}

      {localVideoTrack && (
        <div className="absolute bottom-6 right-6 w-48 aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-white/10">
          <VideoTrack trackRef={localVideoTrack} className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  )
}

function ScreenShareButton({ allowed }: { allowed: boolean }) {
  const { localParticipant } = useLocalParticipant()
  const [sharing, setSharing] = useState(false)

  if (!allowed) return null

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={async () => {
        const next = !sharing
        await localParticipant.setScreenShareEnabled(next)
        setSharing(next)
      }}
      className="pointer-events-auto rounded-full gap-2 font-bold shadow-xl"
    >
      <MonitorUp className="h-5 w-5" />
      {sharing ? 'Stop Share' : 'Share Screen'}
    </Button>
  )
}

export function ActivePrivateSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { data: userData } = useCurrentUser()
  const currentUser = userData?.data.user
  const joinMutation = useStartPrivateSession()
  const endMutation = useEndPrivateSession()
  
  const [token, setToken] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [session, setSession] = useState<PrivateSessionDto | null>(null)

  const returnUrl = session?.publicRoomId
    ? (currentUser?.id === session.viewerId 
        ? `/rooms/${session.publicRoomId}` 
        : '/studio')
    : '/'

  useEffect(() => {
    if (!sessionId) return
    
    // Auto-join on mount
    joinMutation.mutateAsync(sessionId).then((res) => {
      setSession(res.data.privateSession)
      setToken(res.data.livekitToken)
      setUrl(res.data.livekitUrl)
    }).catch(() => {
      toast.error('Failed to join private session')
      navigate(returnUrl)
    })
  }, [sessionId, navigate, returnUrl])

  const handleEnd = async () => {
    try {
      await endMutation.mutateAsync(sessionId!)
      toast.success('Session ended')
      navigate(returnUrl)
    } catch {
      toast.error('Failed to end session')
    }
  }

  if (!token || !url || !session) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-zinc-400">Joining private session...</p>
      </div>
    )
  }

  const isViewer = currentUser?.id === session.viewerId

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col relative bg-black">
      <LiveKitRoom
        video={!isViewer || session.viewerCamMode !== 'OFF'}
        audio={true}
        token={token}
        serverUrl={url}
        onDisconnected={() => {
          toast.error('Disconnected from session')
          navigate(returnUrl)
        }}
        className="w-full h-full"
      >
        <PublishedTracks />
        <div className="absolute bottom-6 left-6 pointer-events-none">
          <ScreenShareButton allowed={session.screenShareAllowed} />
        </div>
      </LiveKitRoom>

      {/* Top overlay controls */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          {session.hardEndAt && <CountdownTimer hardEndAt={session.hardEndAt} />}
        </div>
        
        <Button 
          variant="destructive" 
          size="lg" 
          onClick={handleEnd}
          loading={endMutation.isPending}
          className="pointer-events-auto rounded-full gap-2 font-bold shadow-xl shadow-red-500/20"
        >
          <PhoneOff className="h-5 w-5" /> End Session
        </Button>
      </div>
    </div>
  )
}
