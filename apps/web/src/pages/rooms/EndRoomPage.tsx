import { useNavigate, useParams } from 'react-router-dom'
import { useEndRoom } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

export function EndRoomPage() {
  const navigate = useNavigate()
  const { roomId } = useParams<{ roomId: string }>()
  const mutation = useEndRoom()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">End Room</h1>
      <Button
        variant="destructive"
        onClick={async () => {
          try {
            await mutation.mutateAsync(roomId!)
            toast.success('Room ended')
            navigate(-1)
          } catch {
            toast.error('Failed to end room')
          }
        }}
        loading={mutation.isPending}
      >
        End Room
      </Button>
    </div>
  )
}
