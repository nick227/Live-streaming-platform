import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCaptureRoomThumbnail } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { captureVideoFrameAsFormData } from '@/lib/captureVideoFrame'

export function CaptureRoomThumbnailPage() {
  const navigate = useNavigate()
  const { roomId } = useParams<{ roomId: string }>()
  const mutation = useCaptureRoomThumbnail()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((s) => {
      stream = s
      if (videoRef.current) videoRef.current.srcObject = stream
    }).catch(() => {
      toast.error('Could not access camera')
    })
    return () => {
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-semibold">Capture Room Thumbnail</h1>
      <div className="aspect-video overflow-hidden rounded-lg border border-border bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover transform scale-x-[-1]"
        />
      </div>
      <Button
        onClick={async () => {
          if (!videoRef.current) {
            toast.error('Camera not ready')
            return
          }
          try {
            const formData = await captureVideoFrameAsFormData(videoRef.current)
            await mutation.mutateAsync({ roomId: roomId!, formData })
            toast.success('Thumbnail captured')
            navigate(-1)
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to capture thumbnail')
          }
        }}
        loading={mutation.isPending}
      >
        Capture current frame
      </Button>
    </div>
  )
}
