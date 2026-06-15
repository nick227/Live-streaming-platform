import { useNavigate, useParams } from 'react-router-dom'
import { useAdminRestoreUser } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

export function AdminRestoreUserPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const mutation = useAdminRestoreUser()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Restore User</h1>
      <Button
        onClick={async () => {
          try {
            await mutation.mutateAsync({ userId: userId! })
            toast.success('User restored')
            navigate(-1)
          } catch {
            toast.error('Failed to restore user')
          }
        }}
        loading={mutation.isPending}
      >
        Restore
      </Button>
    </div>
  )
}
