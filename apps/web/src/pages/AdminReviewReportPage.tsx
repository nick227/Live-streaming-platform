import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { useAdminReviewReport } from '@streamyolo/sdk'
import { Form } from '@/components/ui/Form'
import type { FieldConfig } from '@/components/ui/Form'
import { toast } from 'sonner'

const schema = z.object({
  status: z.enum(['REVIEWED', 'ACTIONED', 'DISMISSED']),
  adminNotes: z.string().max(2000).optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

const fields: FieldConfig[] = [
  { name: 'status', label: 'Decision (REVIEWED / ACTIONED / DISMISSED)', type: 'text', voice: false, required: true },
  { name: 'adminNotes', label: 'Admin Notes', type: 'textarea', voice: true, required: false, rows: 4 },
]

export function AdminReviewReportPage() {
  const navigate = useNavigate()
  const { reportId } = useParams<{ reportId: string }>()
  const mutation = useAdminReviewReport()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Review Report</h1>
      <Form<FormData>
        fields={fields}
        schema={schema}
        onSubmit={async (data) => {
          try {
            await mutation.mutateAsync({ reportId: reportId!, status: data.status, adminNotes: data.adminNotes || undefined })
            toast.success('Report reviewed')
            navigate(-1)
          } catch {
            toast.error('Failed to review report')
          }
        }}
        isLoading={mutation.isPending}
        submitLabel="Submit Review"
      />
    </div>
  )
}
