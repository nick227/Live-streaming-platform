import { useParams } from 'react-router-dom'
import { useAdminHideRoom } from '@streamyolo/sdk'
import { AdminActionPage } from '@/components/admin/AdminActionPage'

export function AdminHideRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const mutation = useAdminHideRoom()
  return (
    <AdminActionPage
      title="Hide Room"
      submitLabel="Hide Room"
      successMessage="Room hidden"
      errorMessage="Failed to hide room"
      onSubmit={(reason) => mutation.mutateAsync({ roomId: roomId!, reason })}
      isPending={mutation.isPending}
    />
  )
}
