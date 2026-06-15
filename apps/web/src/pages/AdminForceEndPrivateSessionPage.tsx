import { useParams } from 'react-router-dom'
import { useAdminForceEndPrivateSession } from '@streamyolo/sdk'
import { AdminActionPage } from '@/components/admin/AdminActionPage'

export function AdminForceEndPrivateSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const mutation = useAdminForceEndPrivateSession()
  return (
    <AdminActionPage
      title="Force End Private Session"
      submitLabel="Force End"
      successMessage="Session force-ended"
      errorMessage="Failed to force-end session"
      onSubmit={(reason) => mutation.mutateAsync({ sessionId: sessionId!, reason })}
      isPending={mutation.isPending}
    />
  )
}
