import { useNavigate } from 'react-router-dom'
import type { ZodSchema } from 'zod'
import { Form } from './Form'
import type { FieldConfig } from './Form'

interface SimpleFormPageProps {
  title: string
  fields: FieldConfig[]
  schema: ZodSchema<Record<string, unknown>>
  onSubmit: (data: Record<string, unknown>) => Promise<unknown>
  isPending: boolean
  submitLabel: string
}

export function SimpleFormPage({ title, fields, schema, onSubmit, isPending, submitLabel }: SimpleFormPageProps) {
  const navigate = useNavigate()
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      <Form
        fields={fields}
        schema={schema}
        onSubmit={async (data) => {
          await onSubmit(data)
          navigate(-1)
        }}
        isLoading={isPending}
        submitLabel={submitLabel}
      />
    </div>
  )
}
