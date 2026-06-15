import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { useRequestPrivateSession } from '@streamyolo/sdk'
import { Form } from '@/components/ui/Form'
import type { FieldConfig } from '@/components/ui/Form'
import { toast } from 'sonner'

const schema = z.object({
  message: z.string().max(300).optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

const fields: FieldConfig[] = [
  { name: 'message', label: 'Message to creator (optional)', type: 'textarea', voice: true, required: false, rows: 4 },
]

export function RequestPrivateSessionPage() {
  const navigate = useNavigate()
  const { roomId } = useParams<{ roomId: string }>()
  const mutation = useRequestPrivateSession()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Request Private Session</h1>
      <Form<FormData>
        fields={fields}
        schema={schema}
        onSubmit={async (data) => {
          try {
            await mutation.mutateAsync({ roomId: roomId!, ...data })
            toast.success('Session requested')
            navigate(-1)
          } catch {
            toast.error('Failed to request session')
          }
        }}
        isLoading={mutation.isPending}
        submitLabel="Request Session"
      />
    </div>
  )
}
