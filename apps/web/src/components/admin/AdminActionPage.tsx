import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Form } from '@/components/ui/Form'
import type { FieldConfig } from '@/components/ui/Form'
import { toast } from 'sonner'

interface AdminActionPageProps {
  title: string
  submitLabel: string
  reasonRequired?: boolean
  successMessage: string
  errorMessage: string
  onSubmit: (reason: string) => Promise<unknown>
  isPending: boolean
}

const optionalSchema = z.object({ reason: z.string().max(500).optional().or(z.literal('')) })
const requiredSchema = z.object({ reason: z.string().min(1).max(500) })

const optionalFields: FieldConfig[] = [
  { name: 'reason', label: 'Reason (optional)', type: 'textarea', voice: true, required: false, rows: 4 },
]
const requiredFields: FieldConfig[] = [
  { name: 'reason', label: 'Reason', type: 'textarea', voice: true, required: true, rows: 4 },
]

export function AdminActionPage({
  title, submitLabel, reasonRequired, successMessage, errorMessage, onSubmit, isPending,
}: AdminActionPageProps) {
  const navigate = useNavigate()
  const schema = reasonRequired ? requiredSchema : optionalSchema
  const fields = reasonRequired ? requiredFields : optionalFields

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      <Form
        fields={fields}
        schema={schema}
        onSubmit={async (data) => {
          try {
            await onSubmit((data as any).reason ?? '')
            toast.success(successMessage)
            navigate(-1)
          } catch {
            toast.error(errorMessage)
          }
        }}
        isLoading={isPending}
        submitLabel={submitLabel}
      />
    </div>
  )
}
