import { useAdminOverview } from '@streamyolo/sdk'
import { StatCard } from '@/components/admin/StatCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Radio, Users, Star, Flag, CreditCard, Lock } from 'lucide-react'

export function AdminOverviewPage() {
  const { data, isLoading } = useAdminOverview()

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
    </div>
  )

  const m = (data as any)?.data ?? {}

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Live rooms" value={m.liveRoomCount ?? 0} icon={Radio} />
        <StatCard label="Total users" value={m.totalUsers ?? 0} icon={Users} />
        <StatCard label="Total creators" value={m.totalCreators ?? 0} icon={Star} />
        <StatCard label="Pending reports" value={m.pendingReports ?? 0} icon={Flag} accent />
        <StatCard label="Pending payments" value={m.pendingPayments ?? 0} icon={CreditCard} accent />
        <StatCard label="Active sessions" value={m.activePrivateSessions ?? 0} icon={Lock} />
      </div>
    </div>
  )
}
