import { z } from 'zod'
import { useGetLivekitToken } from '@streamyolo/sdk'
import { SimpleFormPage } from '@/components/ui/SimpleFormPage'
import type { FieldConfig } from '@/components/ui/Form'

const schema = z.object({
  appRoomType: z.enum(['PUBLIC_ROOM', 'PRIVATE_SESSION']),
  appRoomId: z.string().min(1),
})

const fields: FieldConfig[] = [
  { name: 'appRoomType', label: 'Room Type', type: 'text', voice: false, required: true },
  { name: 'appRoomId', label: 'Room ID', type: 'text', voice: false, required: true },
]

export function GetLivekitTokenPage() {
  const mutation = useGetLivekitToken()
  return (
    <SimpleFormPage
      title="Get LiveKit Token"
      fields={fields}
      schema={schema}
      onSubmit={(data) => mutation.mutateAsync(data as any)}
      isPending={mutation.isPending}
      submitLabel="Get Token"
    />
  )
}
