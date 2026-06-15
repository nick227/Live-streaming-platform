import { useNavigate, useParams } from 'react-router-dom'
import { useGoLive } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

export function GoLivePage() {
  const navigate = useNavigate()
  const { roomId } = useParams<{ roomId: string }>()
  const mutation = useGoLive()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Go Live</h1>
      <Button
        onClick={async () => {
          try {
            await mutation.mutateAsync(roomId!)
            toast.success("You're live!")
            navigate(-1)
          } catch {
            toast.error('Failed to go live')
          }
        }}
        loading={mutation.isPending}
      >
        Go Live
      </Button>
    </div>
  )
}
