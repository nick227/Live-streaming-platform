import { Link } from 'react-router-dom'
import { useAdminMedia } from '@streamyolo/sdk'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { AdminListPage } from '@/components/admin/AdminListPage'
import { Image } from 'lucide-react'

export function AdminMediaPage() {
  const { data, isLoading } = useAdminMedia()
  const items = (data?.data as any[]) ?? []

  return (
    <AdminListPage
      title="Media"
      isLoading={isLoading}
      items={items}
      emptyIcon={Image}
      emptyTitle="No media"
      emptyDescription="Uploaded media assets will appear here for review."
      renderItem={(asset: any) => (
        <div key={asset.id} className="flex items-center justify-between py-3 gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {asset.url && (
              <img src={asset.url} alt={asset.type} className="h-10 w-10 rounded object-cover shrink-0 bg-muted" />
            )}
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{asset.type.replace(/_/g, ' ')}</p>
              <p className="text-xs text-muted-foreground">{asset.source} · {new Date(asset.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={asset.status} />
            <Link to={`/admin/media/${asset.id}/approve`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Approve</Link>
            <Link to={`/admin/media/${asset.id}/hide`} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Hide</Link>
          </div>
        </div>
      )}
    />
  )
}
