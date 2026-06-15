import { z } from 'zod'
import { useUpdateCreatorProfile } from '@streamyolo/sdk'
import { Form } from '@/components/ui/Form'
import type { FieldConfig } from '@/components/ui/Form'
import { toast } from 'sonner'

const RATE_OPTIONS = [6, 12, 18, 24, 30, 48, 60, 90, 120].map((n) => ({
  label: `${n} tokens/min`,
  value: String(n),
}))

const MINUTE_OPTIONS = Array.from({ length: 15 }, (_, i) => {
  const n = i + 1
  return { label: `${n} min`, value: String(n) }
})

const BOOL_OPTIONS = [
  { label: 'No', value: 'false' },
  { label: 'Yes', value: 'true' },
]

const schema = z.object({
  stageName: z.string().min(1).max(50),
  bio: z.string().max(1000).optional().or(z.literal('')),
  privateRateTokensPerMinute: z.string().min(1),
  minPrivateMinutes: z.string().min(1),
  privateViewerCamRequired: z.enum(['true', 'false']),
  privateScreenShareAllowed: z.enum(['true', 'false']),
  privateRulesText: z.string().max(2000).optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

const fields: FieldConfig[] = [
  { name: 'stageName', label: 'Screen Name', type: 'text', voice: false, required: true },
  { name: 'bio', label: 'Bio', type: 'textarea', voice: true, required: false, rows: 3 },
  { name: 'privateRateTokensPerMinute', label: 'Private Rate (tokens/min)', type: 'select', voice: false, required: true, options: RATE_OPTIONS },
  { name: 'minPrivateMinutes', label: 'Min Private Minutes', type: 'select', voice: false, required: true, options: MINUTE_OPTIONS },
  { name: 'privateViewerCamRequired', label: 'Viewer Cam Required', type: 'select', voice: false, required: true, options: BOOL_OPTIONS },
  { name: 'privateScreenShareAllowed', label: 'Screen Share Allowed', type: 'select', voice: false, required: true, options: BOOL_OPTIONS },
  { name: 'privateRulesText', label: 'Private Rules', type: 'textarea', voice: true, required: false, rows: 3 },
]

type ProfileSettingsFormProps = {
  defaults: FormData
}

export function ProfileSettingsForm({ defaults }: ProfileSettingsFormProps) {
  const mutation = useUpdateCreatorProfile()

  return (
    <Form<FormData>
      fields={fields}
      schema={schema}
      defaultValues={defaults}
      onSubmit={async (formData) => {
        try {
          await mutation.mutateAsync({
            stageName: formData.stageName,
            bio: formData.bio || undefined,
            privateRateTokensPerMinute: Number(formData.privateRateTokensPerMinute),
            minPrivateMinutes: Number(formData.minPrivateMinutes),
            privateViewerCamRequired: formData.privateViewerCamRequired === 'true',
            privateScreenShareAllowed: formData.privateScreenShareAllowed === 'true',
            privateRulesText: formData.privateRulesText || undefined,
          })
          toast.success('Profile saved')
        } catch {
          toast.error('Failed to save profile')
        }
      }}
      isLoading={mutation.isPending}
      submitLabel="Save Profile"
    />
  )
}

export type { FormData as ProfileFormData }
