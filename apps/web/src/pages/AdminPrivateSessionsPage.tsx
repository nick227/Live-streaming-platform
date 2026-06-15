import { Link } from 'react-router-dom'
import { useAdminPrivateSessions } from '@streamyolo/sdk'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { AdminListPage } from '@/components/admin/AdminListPage'
import { Lock } from 'lucide-react'

export function AdminPrivateSessionsPage() {
  const { data, isLoading } = useAdminPrivateSessions()
  const items = (data?.data as any[]) ?? []

  return (
    <AdminListPage
      title="Private Sessions"
      isLoading={isLoading}
      items={items}
      emptyIcon={Lock}
      emptyTitle="No private sessions"
      emptyDescription="Active or past private sessions will appear here."
      renderItem={(session: any) => (
        <div key={session.id} className="flex items-center justify-between py-3 gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              Creator {session.creatorId?.slice(0, 8)} · Viewer {session.viewerId?.slice(0, 8)}
            </p>
            <p className="text-xs text-muted-foreground">
              {session.rateTokensPerMinute} tokens/min · reserved {session.reservedTokens?.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={session.status} />
            <Link to={`/admin/private-sessions/${session.id}/force-end`} className="text-xs text-muted-foreground hover:text-foreground">
              Force end
            </Link>
          </div>
        </div>
      )}
    />
  )
}
