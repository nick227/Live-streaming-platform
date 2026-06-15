import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { useCreateTip } from '@streamyolo/sdk'
import { Form } from '@/components/ui/Form'
import type { FieldConfig } from '@/components/ui/Form'
import { toast } from 'sonner'

const schema = z.object({
  amountTokens: z.coerce.number().min(1),
  requestType: z.enum(['GENERAL', 'MENU_ITEM', 'CUSTOM', 'GOAL']),
  menuItemId: z.string().optional().or(z.literal('')),
  requestText: z.string().max(500).optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

const fields: FieldConfig[] = [
  { name: 'amountTokens', label: 'Token Amount', type: 'text', voice: false, required: true },
  { name: 'requestType', label: 'Type (GENERAL / MENU_ITEM / CUSTOM / GOAL)', type: 'text', voice: false, required: true },
  { name: 'menuItemId', label: 'Menu Item ID (if MENU_ITEM)', type: 'text', voice: false, required: false },
  { name: 'requestText', label: 'Message (optional)', type: 'textarea', voice: true, required: false, rows: 3 },
]

export function CreateTipPage() {
  const navigate = useNavigate()
  const { roomId } = useParams<{ roomId: string }>()
  const mutation = useCreateTip()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Send Tip</h1>
      <Form<FormData>
        fields={fields}
        schema={schema}
        onSubmit={async (data) => {
          try {
            await mutation.mutateAsync({
              roomId: roomId!,
              amountTokens: data.amountTokens,
              requestType: data.requestType,
              menuItemId: data.menuItemId || undefined,
              requestText: data.requestText || undefined,
            })
            toast.success('Tip sent!')
            navigate(-1)
          } catch {
            toast.error('Failed to send tip')
          }
        }}
        isLoading={mutation.isPending}
        submitLabel="Send Tip"
      />
    </div>
  )
}
