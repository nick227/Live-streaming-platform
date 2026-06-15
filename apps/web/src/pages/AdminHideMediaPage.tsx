import { useParams } from 'react-router-dom'
import { useAdminHideMedia } from '@streamyolo/sdk'
import { AdminActionPage } from '@/components/admin/AdminActionPage'

export function AdminHideMediaPage() {
  const { mediaId } = useParams<{ mediaId: string }>()
  const mutation = useAdminHideMedia()
  return (
    <AdminActionPage
      title="Hide Media"
      submitLabel="Hide Media"
      successMessage="Media hidden"
      errorMessage="Failed to hide media"
      onSubmit={(reason) => mutation.mutateAsync({ mediaId: mediaId!, reason })}
      isPending={mutation.isPending}
    />
  )
}
