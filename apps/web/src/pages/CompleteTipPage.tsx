import { useNavigate, useParams } from 'react-router-dom'
import { useCompleteTip } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

export function CompleteTipPage() {
  const navigate = useNavigate()
  const { tipId } = useParams<{ tipId: string }>()
  const mutation = useCompleteTip()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Complete Tip</h1>
      <Button
        onClick={async () => {
          try {
            await mutation.mutateAsync(tipId!)
            toast.success('Tip completed')
            navigate(-1)
          } catch {
            toast.error('Failed to complete tip')
          }
        }}
        loading={mutation.isPending}
      >
        Complete
      </Button>
    </div>
  )
}
