import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useUpdateCreatorProfile } from '@streamyolo/sdk'
import { Form } from '@/components/ui/Form'
import type { FieldConfig } from '@/components/ui/Form'
import { toast } from 'sonner'

const schema = z.object({
  stageName: z.string().min(1).max(50).optional().or(z.literal('')),
  bio: z.string().max(1000).optional().or(z.literal('')),
  privateRateTokensPerMinute: z.string().optional().or(z.literal('')),
  minPrivateMinutes: z.string().optional().or(z.literal('')),
  privateViewerCamRequired: z.string().optional().or(z.literal('')),
  privateScreenShareAllowed: z.string().optional().or(z.literal('')),
  privateRulesText: z.string().max(2000).optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

const fields: FieldConfig[] = [
  { name: 'stageName', label: 'Stage Name', type: 'text', voice: false, required: false },
  { name: 'bio', label: 'Bio', type: 'textarea', voice: true, required: false, rows: 4 },
  { name: 'privateRateTokensPerMinute', label: 'Private Rate (tokens/min)', type: 'text', voice: false, required: false },
  { name: 'minPrivateMinutes', label: 'Min Private Minutes', type: 'text', voice: false, required: false },
  { name: 'privateViewerCamRequired', label: 'Viewer Cam Required', type: 'text', voice: false, required: false },
  { name: 'privateScreenShareAllowed', label: 'Screen Share Allowed', type: 'text', voice: false, required: false },
  { name: 'privateRulesText', label: 'Private Rules', type: 'textarea', voice: true, required: false, rows: 4 },
]

export function UpdateCreatorProfilePage() {
  const navigate = useNavigate()
  const mutation = useUpdateCreatorProfile()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit Creator Profile</h1>
      <Form<FormData>
        fields={fields}
        schema={schema}
        onSubmit={async (formData) => {
          try {
            await mutation.mutateAsync(formData)
            toast.success('Profile saved')
            navigate(-1)
          } catch {
            toast.error('Failed to save profile')
          }
        }}
        isLoading={mutation.isPending}
        submitLabel="Save Changes"
      />
    </div>
  )
}
