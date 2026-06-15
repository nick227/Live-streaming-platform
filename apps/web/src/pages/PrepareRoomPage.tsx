import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { usePrepareRoom } from '@streamyolo/sdk'
import { Form } from '@/components/ui/Form'
import type { FieldConfig } from '@/components/ui/Form'
import { toast } from 'sonner'

const schema = z.object({
  title: z.string().min(1).max(200),
  visibility: z.string().optional().or(z.literal('')),
  thumbnailMediaId: z.string().optional().or(z.literal('')),
  coverMediaId: z.string().optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

const fields: FieldConfig[] = [
  { name: 'title', label: 'Room Title', type: 'text', voice: true, required: true },
  { name: 'visibility', label: 'Visibility (PUBLIC / UNLISTED)', type: 'text', voice: false, required: false },
  { name: 'thumbnailMediaId', label: 'Thumbnail Media ID', type: 'text', voice: false, required: false },
  { name: 'coverMediaId', label: 'Cover Media ID', type: 'text', voice: false, required: false },
]

export function PrepareRoomPage() {
  const navigate = useNavigate()
  const mutation = usePrepareRoom()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">New Room</h1>
      <Form<FormData>
        fields={fields}
        schema={schema}
        onSubmit={async (data) => {
          try {
            await mutation.mutateAsync(data)
            toast.success('Room created')
            navigate(-1)
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
