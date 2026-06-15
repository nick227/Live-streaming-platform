import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminUsers } from '@streamyolo/sdk'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Coins, Users } from 'lucide-react'

export function AdminTokenGrantsPage() {
  const [q, setQ] = useState('')
  const { data, isLoading } = useAdminUsers(q ? { q } : undefined)
  const users: any[] = (data as any)?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Token Grants</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search for a user and adjust their token balance.
        </p>
      </div>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search users by name, username, or email…"
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : users.length === 0 ? (
        q ? (
          <EmptyState icon={Users} title="No users found" description="Try a different search." />
        ) : (
          <EmptyState icon={Coins} title="Search for a user" description="Enter a name or email above to find users." />
        )
      ) : (
        <div className="divide-y divide-border rounded-xl border">
          {users.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{user.displayName}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
              <Link
                to={`/admin/wallets/${user.id}/adjust`}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent transition-colors"
              >
                <Coins className="h-3.5 w-3.5" />
                Grant Tokens
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
