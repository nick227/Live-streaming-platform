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
  fallback,
}: {
  roomId: string
  isLive: boolean
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

  if (!isLive || failed) return <>{fallback}</>
  if (isPending && !credentials) {
    return <Skeleton className="aspect-video w-full rounded-lg" />
  }
  if (!credentials) return <>{fallback}</>

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={credentials.token}
      serverUrl={credentials.url}
      className="relative aspect-video bg-black rounded-lg overflow-hidden"
    >
      <RemoteCamera />
    </LiveKitRoom>
  )
}
