import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { useAdminTags, useAdminUpdateTag } from '@streamyolo/sdk'
import { Form } from '@/components/ui/Form'
import type { FieldConfig } from '@/components/ui/Form'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from 'sonner'

const schema = z.object({
  label: z.string().min(1).max(100),
  group: z.string().max(60).optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().min(0).optional(),
})
type FormData = z.infer<typeof schema>

const fields: FieldConfig[] = [
  { name: 'label', label: 'Display Label', type: 'text', voice: true, required: true },
  { name: 'group', label: 'Group (optional)', type: 'text', required: false },
  { name: 'sortOrder', label: 'Sort Order', type: 'text', required: false },
]

export function AdminEditTagPage() {
  const { tagId } = useParams<{ tagId: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useAdminTags()
  const mutation = useAdminUpdateTag()

  const tags: any[] = (data as any)?.data ?? []
  const tag = tags.find((t: any) => t.id === tagId)

  if (isLoading) return <Skeleton className="h-48 w-full" />
  if (!tag) return <p className="text-muted-foreground">Tag not found.</p>

  async function handleSubmit(values: FormData) {
    try {
      await mutation.mutateAsync({
        tagId: tagId!,
        label: values.label,
        group: values.group || undefined,
        sortOrder: values.sortOrder,
      })
      toast.success('Tag updated')
      navigate('/admin/tags')
    } catch {
      toast.error('Failed to update tag')
    }
  }

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-xl font-semibold">Edit Tag</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">{tag.slug}</p>
      </div>
      <Form<FormData>
        fields={fields}
        schema={schema}
        defaultValues={{ label: tag.label, group: tag.group ?? '', sortOrder: tag.sortOrder }}
        onSubmit={handleSubmit}
        isLoading={mutation.isPending}
        submitLabel="Save Changes"
      />
    </div>
  )
}
