import { z } from 'zod'
import { useHandleCcbillWebhook } from '@streamyolo/sdk'
import { SimpleFormPage } from '@/components/ui/SimpleFormPage'
import type { FieldConfig } from '@/components/ui/Form'

const schema = z.object({})

const fields: FieldConfig[] = []

export function HandleCcbillWebhookPage() {
  const mutation = useHandleCcbillWebhook()
  return (
    <SimpleFormPage
      title="CCBill Webhook"
      fields={fields}
      schema={schema}
      onSubmit={() => mutation.mutateAsync({})}
      isPending={mutation.isPending}
      submitLabel="Trigger Webhook"
    />
  )
}
