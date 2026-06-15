import { Link } from 'react-router-dom'
import { useAdminCreators } from '@streamyolo/sdk'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { AdminListPage } from '@/components/admin/AdminListPage'
import { Star } from 'lucide-react'

export function AdminCreatorsPage() {
  const { data, isLoading } = useAdminCreators()
  const items = (data?.data as any[]) ?? []

  return (
    <AdminListPage
      title="Creators"
      isLoading={isLoading}
      items={items}
      emptyIcon={Star}
      emptyTitle="No creators"
      emptyDescription="Creator profiles will appear here once submitted."
      renderItem={(creator: any) => (
        <div key={creator.id} className="flex items-center justify-between py-3 gap-3">
          <div className="flex-1 min-w-0">
            <Link to={`/admin/creators/${creator.id}`} className="font-medium hover:underline truncate flex items-center gap-2">
              {creator.user?.displayName ?? 'Creator'}
              {creator.isLive && <span className="h-2 w-2 rounded-full bg-destructive shrink-0" />}
            </Link>
            <p className="text-xs text-muted-foreground">{creator.userId?.slice(0, 8)}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={creator.status} />
            <Link to={`/admin/creators/${creator.id}/approve`} className="text-xs text-muted-foreground hover:text-foreground">Approve</Link>
            <Link to={`/admin/creators/${creator.id}/suspend`} className="text-xs text-muted-foreground hover:text-foreground">Suspend</Link>
          </div>
        </div>
      )}
    />
  )
}
