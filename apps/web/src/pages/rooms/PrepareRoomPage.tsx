import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCreatorProfile, usePrepareRoom } from '@streamyolo/sdk'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { GoLivePage } from './GoLivePage'

function StudioLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">Setting up your studio...</p>
    </div>
  )
}

export function PrepareRoomPage() {
  const navigate = useNavigate()
  const mutation = usePrepareRoom()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    async function createAndRedirect() {
      try {
        const result = await mutation.mutateAsync({
          title: 'Untitled Broadcast',
          visibility: 'PUBLIC',
          saveAsDefaults: false,
        })
        navigate('/studio', { replace: true, state: { roomId: result.data.room.id } })
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to prepare room')
        navigate('/creator/rooms', { replace: true })
      }
    }

    createAndRedirect()
  }, [mutation, navigate])

  return <StudioLoading />
}

export function StudioPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: profileData, isLoading: profileLoading } = useCreatorProfile()
  const mutation = usePrepareRoom()
  const hasRun = useRef(false)
  const [preparedRoomId, setPreparedRoomId] = useState<string | null>(null)
  const currentRoomId = profileData?.data?.currentRoomId ?? null
  const selectedRoomId =
    typeof location.state === 'object' &&
    location.state !== null &&
    'roomId' in location.state &&
    typeof location.state.roomId === 'string'
      ? location.state.roomId
      : null
  const studioRoomId = currentRoomId ?? selectedRoomId ?? preparedRoomId

  useEffect(() => {
    if (profileLoading || studioRoomId || hasRun.current) return
    hasRun.current = true

    async function createRoom() {
      try {
        const result = await mutation.mutateAsync({
          title: 'Untitled Broadcast',
          visibility: 'PUBLIC',
          saveAsDefaults: false,
        })
        setPreparedRoomId(result.data.room.id)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to prepare room')
        navigate('/creator/rooms', { replace: true })
      }
    }

    createRoom()
  }, [mutation, navigate, profileLoading, studioRoomId])

  if (profileLoading || !studioRoomId) return <StudioLoading />

  return <GoLivePage studioRoomId={studioRoomId} />
}
