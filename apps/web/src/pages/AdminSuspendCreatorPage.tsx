import { useParams } from 'react-router-dom'
import { useAdminSuspendCreator } from '@streamyolo/sdk'
import { AdminActionPage } from '@/components/admin/AdminActionPage'

export function AdminSuspendCreatorPage() {
  const { creatorId } = useParams<{ creatorId: string }>()
  const mutation = useAdminSuspendCreator()
  return (
    <AdminActionPage
      title="Suspend Creator"
      submitLabel="Suspend Creator"
      reasonRequired
      successMessage="Creator suspended"
      errorMessage="Failed to suspend creator"
      onSubmit={(reason) => mutation.mutateAsync({ creatorId: creatorId!, reason })}
      isPending={mutation.isPending}
    />
  )
}
