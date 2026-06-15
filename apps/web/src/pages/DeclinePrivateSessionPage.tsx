import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { useDeclinePrivateSession } from '@streamyolo/sdk'
import { Form } from '@/components/ui/Form'
import type { FieldConfig } from '@/components/ui/Form'
import { toast } from 'sonner'

const schema = z.object({
  reason: z.string().max(300).optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

const fields: FieldConfig[] = [
  { name: 'reason', label: 'Reason (optional)', type: 'textarea', voice: true, required: false, rows: 4 },
]

export function DeclinePrivateSessionPage() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const mutation = useDeclinePrivateSession()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Decline Private Session</h1>
      <Form<FormData>
        fields={fields}
        schema={schema}
        onSubmit={async (data) => {
          try {
            await mutation.mutateAsync({ sessionId: sessionId!, ...data })
            toast.success('Session declined')
            navigate(-1)
          } catch {
            toast.error('Failed to decline session')
          }
        }}
        isLoading={mutation.isPending}
        submitLabel="Decline"
      />
    </div>
  )
}
