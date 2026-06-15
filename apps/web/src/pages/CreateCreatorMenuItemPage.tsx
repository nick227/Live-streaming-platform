import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useCreateCreatorMenuItem } from '@streamyolo/sdk'
import { Form } from '@/components/ui/Form'
import type { FieldConfig } from '@/components/ui/Form'
import { toast } from 'sonner'

const schema = z.object({
  label: z.string().min(1).max(100),
  description: z.string().max(300).optional().or(z.literal('')),
  tokenAmount: z.string(),
  sortOrder: z.string().optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

const fields: FieldConfig[] = [
  { name: 'label', label: 'Label', type: 'text', voice: false, required: true },
  { name: 'description', label: 'Description', type: 'textarea', voice: true, required: false, rows: 3 },
  { name: 'tokenAmount', label: 'Token Amount', type: 'text', voice: false, required: true },
  { name: 'sortOrder', label: 'Sort Order', type: 'text', voice: false, required: false },
]

export function CreateCreatorMenuItemPage() {
  const navigate = useNavigate()
  const mutation = useCreateCreatorMenuItem()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">New Menu Item</h1>
      <Form<FormData>
        fields={fields}
        schema={schema}
        onSubmit={async (data) => {
          try {
            await mutation.mutateAsync(data)
            toast.success('Menu item created')
            navigate(-1)
          } catch {
            toast.error('Failed to create item')
          }
        }}
        isLoading={mutation.isPending}
        submitLabel="Create Item"
      />
    </div>
  )
}
