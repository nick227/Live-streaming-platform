import { useNavigate, useParams } from 'react-router-dom'
import { useAcknowledgeTip } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

export function AcknowledgeTipPage() {
  const navigate = useNavigate()
  const { tipId } = useParams<{ tipId: string }>()
  const mutation = useAcknowledgeTip()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Acknowledge Tip</h1>
      <Button
        onClick={async () => {
          try {
            await mutation.mutateAsync(tipId!)
            toast.success('Tip acknowledged')
            navigate(-1)
          } catch {
            toast.error('Failed to acknowledge tip')
          }
        }}
        loading={mutation.isPending}
      >
        Acknowledge
      </Button>
    </div>
  )
}
