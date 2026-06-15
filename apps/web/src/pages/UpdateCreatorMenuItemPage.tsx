import { useParams, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useUpdateCreatorMenuItem } from '@streamyolo/sdk'
import { Form } from '@/components/ui/Form'
import type { FieldConfig } from '@/components/ui/Form'
import { toast } from 'sonner'

const schema = z.object({
  label: z.string().min(1).max(100).optional().or(z.literal('')),
  description: z.string().max(300).optional().or(z.literal('')),
  tokenAmount: z.string().optional().or(z.literal('')),
  isActive: z.string().optional().or(z.literal('')),
  sortOrder: z.string().optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

const fields: FieldConfig[] = [
  { name: 'label', label: 'Label', type: 'text', voice: false, required: false },
  { name: 'description', label: 'Description', type: 'textarea', voice: true, required: false, rows: 3 },
  { name: 'tokenAmount', label: 'Token Amount', type: 'text', voice: false, required: false },
  { name: 'isActive', label: 'Active (true / false)', type: 'text', voice: false, required: false },
  { name: 'sortOrder', label: 'Sort Order', type: 'text', voice: false, required: false },
]

export function UpdateCreatorMenuItemPage() {
  const { menuItemId } = useParams<{ menuItemId: string }>()
  const navigate = useNavigate()
  const mutation = useUpdateCreatorMenuItem()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit Menu Item</h1>
      <Form<FormData>
        fields={fields}
        schema={schema}
        onSubmit={async (formData) => {
          try {
            await mutation.mutateAsync({ menuItemId: menuItemId!, ...formData })
            toast.success('Menu item updated')
            navigate(-1)
          } catch {
            toast.error('Failed to update item')
          }
        }}
        isLoading={mutation.isPending}
        submitLabel="Save Changes"
      />
    </div>
  )
}
