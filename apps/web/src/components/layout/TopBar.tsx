import { Link, useNavigate } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { useCreatorProfile, useEndRoom } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { AuthWidget } from './AuthWidget'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const goLiveButtonClass = 'bg-black hover:bg-black/90 text-white'
const liveRecordingButtonClass = 'bg-red-600 hover:bg-red-700 text-white'

function GoLiveButton() {
  const navigate = useNavigate()
  const { data: profileData } = useCreatorProfile()
  const endRoom = useEndRoom()
  const profile = profileData?.data

  if (profile?.isLive && profile.currentRoomId) {
    return (
      <Button
        size="sm"
        className={liveRecordingButtonClass}
        loading={endRoom.isPending}
        onClick={async () => {
          try {
            await endRoom.mutateAsync(profile.currentRoomId!)
            toast.success('Broadcast ended')
            navigate('/rooms')
          } catch {
            toast.error('Failed to end broadcast')
          }
        }}
      >
        <Radio className="h-4 w-4 mr-1.5" />
        LIVE
      </Button>
    )
  }

  return (
    <Button asChild size="sm" className={goLiveButtonClass}>
      <Link to="/creator/rooms/prepare">
        <Radio className="h-4 w-4 mr-1.5" />
        Go Live
      </Link>
    </Button>
  )
}

export function TopBar({ wide = false }: { wide?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className={cn('mx-auto px-4 h-14 flex items-center justify-between gap-3', wide ? 'max-w-7xl' : 'max-w-3xl')}>
        <Link to="/rooms" className="font-bold text-base tracking-tight shrink-0">
          StreamYolo
        </Link>
        <div className="flex items-center gap-2">
          <GoLiveButton />
          <AuthWidget />
        </div>
      </div>
    </header>
  )
}
