import { z } from 'zod'
import { useCreateCcbillCheckout } from '@streamyolo/sdk'
import { SimpleFormPage } from '@/components/ui/SimpleFormPage'
import type { FieldConfig } from '@/components/ui/Form'

const schema = z.object({ tokenPackId: z.string() })

const fields: FieldConfig[] = [
  { name: 'tokenPackId', label: 'Token Pack Id', type: 'text', voice: false, required: true },
]

export function CreateCcbillCheckoutPage() {
  const mutation = useCreateCcbillCheckout()
  return (
    <SimpleFormPage
      title="New CCBill Checkout"
      fields={fields}
      schema={schema}
      onSubmit={(data) => mutation.mutateAsync(data as any)}
      isPending={mutation.isPending}
      submitLabel="Create Checkout"
    />
  )
}
