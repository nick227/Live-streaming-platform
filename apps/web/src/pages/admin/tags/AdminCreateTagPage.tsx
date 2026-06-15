import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAdminCreateTag } from '@streamyolo/sdk'
import { Form } from '@/components/ui/Form'
import type { FieldConfig } from '@/components/ui/Form'
import { toast } from 'sonner'

const schema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
  label: z.string().min(1).max(100),
  group: z.string().max(60).optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().min(0).optional(),
})
type FormData = z.infer<typeof schema>

const fields: FieldConfig[] = [
  { name: 'slug', label: 'Slug', type: 'text', required: true },
  { name: 'label', label: 'Display Label', type: 'text', voice: true, required: true },
  { name: 'group', label: 'Group (optional)', type: 'text', required: false },
  { name: 'sortOrder', label: 'Sort Order', type: 'text', required: false },
]

export function AdminCreateTagPage() {
  const navigate = useNavigate()
  const mutation = useAdminCreateTag()

  async function handleSubmit(values: FormData) {
    try {
      await mutation.mutateAsync({
        slug: values.slug,
        label: values.label,
        group: values.group || undefined,
        sortOrder: values.sortOrder,
      })
      toast.success('Tag created')
      navigate('/admin/tags')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create tag')
    }
  }

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-xl font-semibold">New Tag</h1>
      <Form<FormData>
        fields={fields}
        schema={schema}
        defaultValues={{ slug: '', label: '', group: '', sortOrder: 0 }}
        onSubmit={handleSubmit}
        isLoading={mutation.isPending}
        submitLabel="Create Tag"
      />
    </div>
  )
}
