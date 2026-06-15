import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminTags, useAdminUpdateTag, useAdminDeleteTag } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tag, Plus, Eye, EyeOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'COUPLES', label: 'Couples' },
  { value: 'TRANS', label: 'Trans' },
]

export function AdminTagsPage() {
  const { data, isLoading } = useAdminTags()
  const updateTag = useAdminUpdateTag()
  const deleteTag = useAdminDeleteTag()
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const tags: any[] = (data as any)?.data ?? []
  const filtered = tags.filter((t) => {
    if (filter === 'active') return t.isActive
    if (filter === 'inactive') return !t.isActive
    return true
  })

  async function toggleActive(tag: any) {
    try {
      await updateTag.mutateAsync({ tagId: tag.id, isActive: !tag.isActive })
      toast.success(tag.isActive ? 'Tag hidden' : 'Tag activated')
    } catch {
      toast.error('Failed to update tag')
    }
  }

  async function handleDelete(tag: any) {
    try {
      await deleteTag.mutateAsync(tag.id)
      toast.success('Tag deactivated')
    } catch {
      toast.error('Failed to delete tag')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Categories — read-only */}
      <div>
        <h1 className="text-xl font-semibold">Content Taxonomy</h1>
        <p className="text-sm text-muted-foreground mt-1">Categories are fixed. Tags are managed here.</p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Categories (fixed)</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <span
              key={c.value}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Tags ({tags.length})</p>
        </div>
        <Button asChild size="sm">
          <Link to="/admin/tags/new">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Tag
          </Link>
        </Button>
      </div>

      <div className="flex gap-2">
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors capitalize',
              filter === f
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:border-primary/50',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Tag} title="No tags" description="Create your first tag." />
      ) : (
        <div className="divide-y divide-border rounded-xl border">
          {filtered.map((tag: any) => (
            <div key={tag.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-medium', !tag.isActive && 'text-muted-foreground line-through')}>
                    {tag.label}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">{tag.slug}</span>
                  {tag.group && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                      {tag.group}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  to={`/admin/tags/${tag.id}/edit`}
                  className="rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => toggleActive(tag)}
                  className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title={tag.isActive ? 'Hide tag' : 'Show tag'}
                >
                  {tag.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => handleDelete(tag)}
                  className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Deactivate tag"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
