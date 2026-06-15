import { useNavigate, useParams } from 'react-router-dom'
import { useAdminApproveMedia } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

export function AdminApproveMediaPage() {
  const navigate = useNavigate()
  const { mediaId } = useParams<{ mediaId: string }>()
  const mutation = useAdminApproveMedia()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Approve Media</h1>
      <Button
        onClick={async () => {
          try {
            await mutation.mutateAsync(mediaId!)
            toast.success('Media approved')
            navigate(-1)
          } catch {
            toast.error('Failed to approve media')
          }
        }}
        loading={mutation.isPending}
      >
        Approve
      </Button>
    </div>
  )
}
