import { useNavigate } from 'react-router-dom'
import { useAdminCreateTag } from '@streamyolo/sdk'
import { toast } from 'sonner'
import {
  TagFormPanel,
  createTagFields,
  createTagSchema,
  tagPayload,
  type CreateTagFormData,
} from './tagFormFields'

export function AdminCreateTagPage() {
  const navigate = useNavigate()
  const mutation = useAdminCreateTag()

  async function handleSubmit(values: CreateTagFormData) {
    try {
      await mutation.mutateAsync({
        slug: values.slug,
        ...tagPayload(values),
      })
      toast.success('Tag created')
      navigate('/admin/tags')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create tag')
    }
  }

  return (
    <TagFormPanel<CreateTagFormData>
      title="New Tag"
      fields={createTagFields}
      schema={createTagSchema}
      defaultValues={{ slug: '', label: '', group: '', sortOrder: 0 }}
      onSubmit={handleSubmit}
      isLoading={mutation.isPending}
      submitLabel="Create Tag"
    />
  )
}
