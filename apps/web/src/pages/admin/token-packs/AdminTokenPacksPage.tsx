import { Link } from 'react-router-dom'
import { useAdminTokenPacks, useAdminUpdateTokenPack, useAdminDeleteTokenPack } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Coins, Eye, EyeOff, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'

export function AdminTokenPacksPage() {
  const { data, isLoading } = useAdminTokenPacks()
  const updatePack = useAdminUpdateTokenPack()
  const deletePack = useAdminDeleteTokenPack()

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
    </div>
  )

  const packs: any[] = (data as any)?.data ?? []

  async function toggleActive(pack: any) {
    try {
      await updatePack.mutateAsync({ packId: pack.id, isActive: !pack.isActive })
      toast.success(pack.isActive ? 'Pack hidden from buyers' : 'Pack made visible')
    } catch {
      toast.error('Failed to update pack')
    }
  }

  async function handleDelete(pack: any) {
    if (!confirm(`Delete "${pack.name}"? This cannot be undone.`)) return
    try {
      await deletePack.mutateAsync(pack.id)
      toast.success('Token pack deleted')
    } catch {
      toast.error('Failed to delete pack')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Token Packs</h1>
        <Button asChild size="sm">
          <Link to="/admin/token-packs/new">New Pack</Link>
        </Button>
      </div>

      {packs.length === 0 ? (
        <EmptyState icon={Coins} title="No token packs" description="Create a pack to let users buy tokens." />
      ) : (
        <div className="divide-y divide-border rounded-xl border">
          {packs.map((pack: any) => (
            <div key={pack.id} className={`flex items-center gap-4 px-4 py-3 ${!pack.isActive ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${!pack.isActive ? 'line-through text-muted-foreground' : ''}`}>
                  {pack.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  ${(pack.priceCents / 100).toFixed(2)} · {pack.tokenAmount.toLocaleString()} tokens
                  {pack.bonusTokenAmount > 0 && ` + ${pack.bonusTokenAmount.toLocaleString()} bonus`}
                  {' · '}sort {pack.sortOrder}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/admin/token-packs/${pack.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={updatePack.isPending}
                  onClick={() => toggleActive(pack)}
                >
                  {pack.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={deletePack.isPending}
                  onClick={() => handleDelete(pack)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
