import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminUsers } from '@streamyolo/sdk'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { AdminListPage } from '@/components/admin/AdminListPage'
import { Input } from '@/components/ui/Input'
import { Users } from 'lucide-react'

export function AdminUsersPage() {
  const [q, setQ] = useState('')
  const { data, isLoading } = useAdminUsers(q ? { q } : undefined)
  const items = (data?.data as any[]) ?? []

  return (
    <AdminListPage
      title="Users"
      isLoading={isLoading}
      items={items}
      emptyIcon={Users}
      emptyTitle="No users found"
      emptyDescription="Try a different search."
      header={
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by username or email…" />
      }
      renderItem={(user: any) => (
        <div key={user.id} className="flex items-center justify-between py-3 gap-3">
          <div className="flex-1 min-w-0">
            <Link to={`/admin/users/${user.id}`} className="font-medium hover:underline">
              {user.username}
            </Link>
            <p className="text-xs text-muted-foreground">{user.role}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={user.status} />
            <Link to={`/admin/users/${user.id}/suspend`} className="text-xs text-muted-foreground hover:text-foreground">Suspend</Link>
            <Link to={`/admin/users/${user.id}/restore`} className="text-xs text-muted-foreground hover:text-foreground">Restore</Link>
          </div>
        </div>
      )}
    />
  )
}
