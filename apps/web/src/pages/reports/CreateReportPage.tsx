import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useCreateReport } from '@streamyolo/sdk'
import { Form } from '@/components/ui/Form'
import type { FieldConfig } from '@/components/ui/Form'
import { toast } from 'sonner'

const schema = z.object({
  targetType: z.enum(['USER', 'ROOM', 'MESSAGE', 'MEDIA']),
  targetUserId: z.string().optional().or(z.literal('')),
  targetRoomId: z.string().optional().or(z.literal('')),
  targetMessageId: z.string().optional().or(z.literal('')),
  targetMediaId: z.string().optional().or(z.literal('')),
  reason: z.string().min(1).max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

const fields: FieldConfig[] = [
  { name: 'targetType', label: 'Report Type (USER / ROOM / MESSAGE / MEDIA)', type: 'text', voice: false, required: true },
  { name: 'targetUserId', label: 'User ID (if reporting a user)', type: 'text', voice: false, required: false },
  { name: 'targetRoomId', label: 'Room ID (if reporting a room)', type: 'text', voice: false, required: false },
  { name: 'targetMessageId', label: 'Message ID (if reporting a message)', type: 'text', voice: false, required: false },
  { name: 'targetMediaId', label: 'Media ID (if reporting media)', type: 'text', voice: false, required: false },
  { name: 'reason', label: 'Reason', type: 'text', voice: false, required: true },
  { name: 'description', label: 'Additional details', type: 'textarea', voice: true, required: false, rows: 4 },
]

export function CreateReportPage() {
  const navigate = useNavigate()
  const mutation = useCreateReport()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Report</h1>
      <Form<FormData>
        fields={fields}
        schema={schema}
        onSubmit={async (data) => {
          try {
            await mutation.mutateAsync(data)
            toast.success('Report submitted')
            navigate(-1)
          } catch {
            toast.error('Failed to submit report')
          }
        }}
        isLoading={mutation.isPending}
        submitLabel="Submit Report"
      />
    </div>
  )
}
