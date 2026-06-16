import { z } from 'zod'
import { Form } from '@/components/ui/Form'
import type { FieldConfig } from '@/components/ui/Form'
import type { ZodSchema } from 'zod'

const editableTagShape = {
  label: z.string().min(1).max(100),
  group: z.string().max(60).optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().min(0).optional(),
}

export const editableTagSchema = z.object(editableTagShape)
export const createTagSchema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
  ...editableTagShape,
})

export type EditableTagFormData = z.infer<typeof editableTagSchema>
export type CreateTagFormData = z.infer<typeof createTagSchema>

export const editableTagFields: FieldConfig[] = [
  { name: 'label', label: 'Display Label', type: 'text', voice: true, required: true },
  { name: 'group', label: 'Group (optional)', type: 'text', required: false },
  { name: 'sortOrder', label: 'Sort Order', type: 'text', required: false },
]

export const createTagFields: FieldConfig[] = [
  { name: 'slug', label: 'Slug', type: 'text', required: true },
  ...editableTagFields,
]

export function tagPayload(values: EditableTagFormData) {
  return {
    label: values.label,
    group: values.group || undefined,
    sortOrder: values.sortOrder,
  }
}

type TagFormPanelProps<T extends Record<string, unknown>> = {
  title: string
  subtitle?: string
  fields: FieldConfig[]
  schema: ZodSchema<T>
  defaultValues: Partial<T>
  onSubmit: (values: T) => Promise<void>
  isLoading: boolean
  submitLabel: string
}

export function TagFormPanel<T extends Record<string, unknown>>({
  title,
  subtitle,
  fields,
  schema,
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel,
}: TagFormPanelProps<T>) {
  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground font-mono mt-1">{subtitle}</p>}
      </div>
      <Form<T>
        fields={fields}
        schema={schema}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        isLoading={isLoading}
        submitLabel={submitLabel}
      />
    </div>
  )
}
