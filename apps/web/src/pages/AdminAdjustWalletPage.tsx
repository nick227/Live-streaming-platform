import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { useAdminAdjustWallet } from '@streamyolo/sdk'
import { Form } from '@/components/ui/Form'
import type { FieldConfig } from '@/components/ui/Form'
import { toast } from 'sonner'

const schema = z.object({
  amountTokens: z.coerce.number(),
  reason: z.string().min(1).max(500),
})
type FormData = z.infer<typeof schema>

const fields: FieldConfig[] = [
  { name: 'amountTokens', label: 'Amount (positive = add, negative = deduct)', type: 'text', voice: false, required: true },
  { name: 'reason', label: 'Reason', type: 'textarea', voice: true, required: true, rows: 4 },
]

export function AdminAdjustWalletPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const mutation = useAdminAdjustWallet()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Adjust Wallet</h1>
      <Form<FormData>
        fields={fields}
        schema={schema}
        onSubmit={async (data) => {
          try {
            await mutation.mutateAsync({ userId: userId!, amountTokens: data.amountTokens, reason: data.reason })
            toast.success('Wallet adjusted')
            navigate(-1)
          } catch {
            toast.error('Failed to adjust wallet')
          }
        }}
        isLoading={mutation.isPending}
        submitLabel="Adjust Wallet"
      />
    </div>
  )
}
