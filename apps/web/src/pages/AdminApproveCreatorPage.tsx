import { useNavigate, useParams } from 'react-router-dom'
import { useAdminApproveCreator } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

export function AdminApproveCreatorPage() {
  const navigate = useNavigate()
  const { creatorId } = useParams<{ creatorId: string }>()
  const mutation = useAdminApproveCreator()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Approve Creator</h1>
      <Button
        onClick={async () => {
          try {
            await mutation.mutateAsync({ creatorId: creatorId! })
            toast.success('Creator approved')
            navigate(-1)
          } catch {
            toast.error('Failed to approve creator')
          }
        }}
        loading={mutation.isPending}
      >
        Approve
      </Button>
    </div>
  )
}
