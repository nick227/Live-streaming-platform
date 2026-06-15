import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { usePrepareRoom } from '@streamyolo/sdk'
import { Form } from '@/components/ui/Form'
import type { FieldConfig } from '@/components/ui/Form'
import { toast } from 'sonner'

const schema = z.object({
  title: z.string().min(1).max(200),
  visibility: z.enum(['PUBLIC', 'UNLISTED']),
})
type FormData = z.infer<typeof schema>

const fields: FieldConfig[] = [
  { name: 'title', label: 'Room Title', type: 'text', voice: true, required: true },
  { 
    name: 'visibility', 
    label: 'Visibility', 
    type: 'select', 
    required: true,
    options: [
      { label: 'Public', value: 'PUBLIC' },
      { label: 'Unlisted', value: 'UNLISTED' }
    ]
  },
]

import { useEffect, useRef } from 'react'

function CameraPreview() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Failed to access camera:', err)
      }
    }
    setupCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <div className="rounded-lg overflow-hidden bg-black aspect-video relative flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform scale-x-[-1]"
      />
      <div className="absolute bottom-2 left-2 right-2 text-white text-xs text-center drop-shadow-md bg-black/40 py-1 rounded">
        Camera & Mic Test
      </div>
    </div>
  )
}

export function PrepareRoomPage() {
  const navigate = useNavigate()
  const mutation = usePrepareRoom()

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold">New Room</h1>
        <p className="text-sm text-muted-foreground">Setup your room and check your equipment before going live.</p>
      </div>

      <CameraPreview />

      <Form<FormData>
        fields={fields}
        schema={schema}
        defaultValues={{ visibility: 'PUBLIC' }}
        onSubmit={async (data) => {
          try {
            const res = await mutation.mutateAsync(data)
            toast.success('Room created')
            navigate(`/creator/rooms/${(res as any).data.room.id}/go-live`, { replace: true })
          } catch {
            toast.error('Failed to create room')
          }
        }}
        isLoading={mutation.isPending}
        submitLabel="Create Room"
      />
    </div>
  )
}
