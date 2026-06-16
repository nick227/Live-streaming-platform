import { useNavigate, useParams } from 'react-router-dom'
import { useAdminTags, useAdminUpdateTag } from '@streamyolo/sdk'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from 'sonner'
import {
  TagFormPanel,
  editableTagFields,
  editableTagSchema,
  tagPayload,
  type EditableTagFormData,
} from './tagFormFields'

export function AdminEditTagPage() {
  const { tagId } = useParams<{ tagId: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useAdminTags()
  const mutation = useAdminUpdateTag()

  const tags: any[] = (data as any)?.data ?? []
  const tag = tags.find((t: any) => t.id === tagId)

  if (isLoading) return <Skeleton className="h-48 w-full" />
  if (!tag) return <p className="text-muted-foreground">Tag not found.</p>

  async function handleSubmit(values: EditableTagFormData) {
    try {
      await mutation.mutateAsync({
        tagId: tagId!,
        ...tagPayload(values),
      })
      toast.success('Tag updated')
      navigate('/admin/tags')
    } catch {
      toast.error('Failed to update tag')
    }
  }

  return (
    <TagFormPanel<EditableTagFormData>
      title="Edit Tag"
      subtitle={tag.slug}
      fields={editableTagFields}
      schema={editableTagSchema}
      defaultValues={{ label: tag.label, group: tag.group ?? '', sortOrder: tag.sortOrder }}
      onSubmit={handleSubmit}
      isLoading={mutation.isPending}
      submitLabel="Save Changes"
    />
  )
}
