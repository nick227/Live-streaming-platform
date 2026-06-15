import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

interface AdminListPageProps {
  title: string
  isLoading: boolean
  items: any[]
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyDescription: string
  renderItem: (item: any) => React.ReactNode
  header?: React.ReactNode
}

export function AdminListPage({
  title, isLoading, items, emptyIcon, emptyTitle, emptyDescription, renderItem, header,
}: AdminListPageProps) {
  if (isLoading) return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
    </div>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      {header}
      {items.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      ) : (
        <Card>
          <CardContent className="py-2 px-4 divide-y">
            {items.map(renderItem)}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
