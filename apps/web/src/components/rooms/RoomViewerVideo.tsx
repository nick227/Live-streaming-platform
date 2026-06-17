import { useEffect, useState } from 'react'
import { LiveKitRoom, VideoTrack, useTracks } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { useGetLivekitToken } from '@streamyolo/sdk'
import { Skeleton } from '@/components/ui/Skeleton'

function RemoteCamera() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true })
  const camera = tracks.find((track) => track.publication.kind === 'video')

  if (!camera) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Waiting for stream...
      </div>
    )
  }

  return <VideoTrack trackRef={camera} className="w-full h-full object-cover" />
}

export function RoomViewerVideo({
  roomId,
  isLive,
  isReconnecting,
  activePrivateSessionId,
  fallback,
}: {
  roomId: string
  isLive: boolean
  isReconnecting?: boolean
  activePrivateSessionId?: string | null
  fallback: React.ReactNode
}) {
  const { mutateAsync: fetchToken, isPending } = useGetLivekitToken()
  const [credentials, setCredentials] = useState<{ token: string; url: string } | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!isLive) {
      setCredentials(null)
      setFailed(false)
      return
    }

    let cancelled = false
    setFailed(false)

    fetchToken({ appRoomType: 'PUBLIC_ROOM', appRoomId: roomId })
      .then((res) => {
        if (cancelled) return
        setCredentials({ token: res.data.token, url: res.data.livekitUrl })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [roomId, isLive, fetchToken])

  if (activePrivateSessionId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-center text-sm font-medium text-white">
        Creator is in a private session
      </div>
    )
  }
  
  if (!isLive) {
    return <>{fallback}</>
  }

  if (isPending) {
    return <Skeleton className="w-full h-full" />
  }

  if (failed || !credentials) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
        <p className="text-sm">Failed to connect to stream</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <LiveKitRoom
        video={false}
        audio={false}
        token={credentials.token}
        serverUrl={credentials.url}
        className="w-full h-full bg-black"
      >
        <RemoteCamera />
      </LiveKitRoom>
      {isReconnecting && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white p-4 text-center animate-in fade-in">
          <div className="h-6 w-6 mb-3 rounded-full border-2 border-t-white border-white/20 animate-spin" />
          <p className="font-semibold mb-1">Creator connection interrupted</p>
          <p className="text-sm text-white/70">Trying to reconnect...</p>
        </div>
      )}
    </div>
  )
}
