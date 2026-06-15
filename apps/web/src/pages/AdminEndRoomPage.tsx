import { useParams } from 'react-router-dom'
import { useAdminEndRoom } from '@streamyolo/sdk'
import { AdminActionPage } from '@/components/admin/AdminActionPage'

export function AdminEndRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const mutation = useAdminEndRoom()
  return (
    <AdminActionPage
      title="End Room"
      submitLabel="End Room"
      successMessage="Room ended"
      errorMessage="Failed to end room"
      onSubmit={(reason) => mutation.mutateAsync({ roomId: roomId!, reason })}
      isPending={mutation.isPending}
    />
  )
}
