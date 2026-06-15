import { Link } from 'react-router-dom'
import { useAdminReports } from '@streamyolo/sdk'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { AdminListPage } from '@/components/admin/AdminListPage'
import { Flag } from 'lucide-react'

export function AdminReportsPage() {
  const { data, isLoading } = useAdminReports()
  const items = (data?.data as any[]) ?? []

  return (
    <AdminListPage
      title="Reports"
      isLoading={isLoading}
      items={items}
      emptyIcon={Flag}
      emptyTitle="No reports"
      emptyDescription="User reports will appear here for review."
      renderItem={(report: any) => (
        <div key={report.id} className="flex items-center justify-between py-3 gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{report.reason}</p>
            <p className="text-xs text-muted-foreground">
              {report.targetType} · {new Date(report.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={report.status} />
            <Link to={`/admin/reports/${report.id}/review`} className="text-xs text-muted-foreground hover:text-foreground">Review</Link>
          </div>
        </div>
      )}
    />
  )
}
