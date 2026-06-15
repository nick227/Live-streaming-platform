import { useParams } from 'react-router-dom'
import { useAdminSuspendUser } from '@streamyolo/sdk'
import { AdminActionPage } from '@/components/admin/AdminActionPage'

export function AdminSuspendUserPage() {
  const { userId } = useParams<{ userId: string }>()
  const mutation = useAdminSuspendUser()
  return (
    <AdminActionPage
      title="Suspend User"
      submitLabel="Suspend User"
      reasonRequired
      successMessage="User suspended"
      errorMessage="Failed to suspend user"
      onSubmit={(reason) => mutation.mutateAsync({ userId: userId!, reason })}
      isPending={mutation.isPending}
    />
  )
}
