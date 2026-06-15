import { useNavigate, useParams } from 'react-router-dom'
import { useCaptureRoomThumbnail } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

export function CaptureRoomThumbnailPage() {
  const navigate = useNavigate()
  const { roomId } = useParams<{ roomId: string }>()
  const mutation = useCaptureRoomThumbnail()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Capture Room Thumbnail</h1>
      <Button
        onClick={async () => {
          try {
            await mutation.mutateAsync({ roomId: roomId!, formData: new FormData() })
            toast.success('Thumbnail captured')
            navigate(-1)
          } catch {
            toast.error('Failed to capture thumbnail')
          }
        }}
        loading={mutation.isPending}
      >
        Capture
      </Button>
    </div>
  )
}
