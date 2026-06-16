import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminCreators } from '@streamyolo/sdk'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { AdminListPage } from '@/components/admin/AdminListPage'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Star } from 'lucide-react'

const STATUS_FILTERS = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Banned', value: 'BANNED' },
] as const

type StatusFilter = (typeof STATUS_FILTERS)[number]['value']

export function AdminCreatorsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const queryStatus = statusFilter === 'ALL' ? undefined : statusFilter
  const { data, isLoading } = useAdminCreators(queryStatus ? { status: queryStatus } : undefined)
  const items = (data?.data as any[]) ?? []

  const header = (
    <div className="flex flex-wrap items-center gap-2">
      {STATUS_FILTERS.map((filter) => (
        <Button
          key={filter.value}
          type="button"
          size="sm"
          variant={statusFilter === filter.value ? 'default' : 'outline'}
          onClick={() => setStatusFilter(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  )

  return (
    <AdminListPage
      title="Creators"
      isLoading={isLoading}
      items={items}
      header={header}
      emptyIcon={Star}
      emptyTitle="No creators"
      emptyDescription="Creator profiles will appear here once submitted."
      renderItem={(creator: any) => {
        const meta = [
          creator.username ? `@${creator.username}` : null,
          creator.defaultRoomCategory ?? null,
          creator.defaultCountryCode ? creator.defaultCountryCode.toUpperCase() : null,
        ].filter(Boolean)

        return (
          <div key={creator.id} className="flex items-center gap-3 py-3">
            <Avatar src={creator.avatarUrl} name={creator.displayName} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/creators/${creator.id}`}
                  className="font-medium hover:underline truncate"
                >
                  {creator.displayName}
                </Link>
                {creator.isLive && (
                  <span className="h-2 w-2 rounded-full bg-destructive shrink-0" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                {meta.length > 0 && (
                  <span className="text-xs text-muted-foreground">{meta.join(' · ')}</span>
                )}
                {(creator.defaultRoomTags ?? []).slice(0, 4).map((tag: any) => (
                  <span
                    key={tag.slug}
                    className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full"
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StatusBadge status={creator.status} />
              <Link
                to={`/admin/creators/${creator.id}/approve`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Approve
              </Link>
              <Link
                to={`/admin/creators/${creator.id}/suspend`}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Suspend
              </Link>
            </div>
          </div>
        )
      }}
    />
  )
}
