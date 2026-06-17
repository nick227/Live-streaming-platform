import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  useAdminTags,
  useAdminDeleteTag,
  useAdminCreateTag,
  useAdminCategories,
  useAdminCreateCategory,
  useAdminUpdateCategory,
  useAdminDeleteCategory,
} from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tag, Plus, Eye, EyeOff, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(',').map((v) => v.trim())
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
    })
    .filter((row) => row.slug && row.label)
}

export function AdminTagsPage() {
  const { data: tagsData, isLoading: tagsLoading } = useAdminTags()
  const { data: categoriesData, isLoading: categoriesLoading } = useAdminCategories()
  const deleteTag = useAdminDeleteTag()
  const createTag = useAdminCreateTag()
  const createCategory = useAdminCreateCategory()
  const updateCategory = useAdminUpdateCategory()
  const deleteCategory = useAdminDeleteCategory()

  const [activeTab, setActiveTab] = useState<'tags' | 'categories'>('tags')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showNewTag, setShowNewTag] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tags: any[] = (tagsData as any)?.data ?? []
  const categories: any[] = (categoriesData as any)?.data ?? []

  const allSelected = tags.length > 0 && tags.every((t) => selected.has(t.id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(tags.map((t) => t.id)))
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return
    setIsDeleting(true)
    try {
      await Promise.all(Array.from(selected).map((id) => deleteTag.mutateAsync(id)))
      toast.success(`Deleted ${selected.size} tag${selected.size > 1 ? 's' : ''}`)
      setSelected(new Set())
    } catch {
      toast.error('Some tags failed to delete')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleDeleteTag(tag: any) {
    try {
      await deleteTag.mutateAsync(tag.id)
      toast.success('Tag deleted')
    } catch {
      toast.error('Failed to delete tag')
    }
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const text = await file.text()
    const rows = parseCsv(text)
    if (rows.length === 0) {
      toast.error('No valid rows. Expected header: slug,label,group,sortOrder')
      return
    }
    setIsImporting(true)
    let success = 0
    let errors = 0
    for (const row of rows) {
      try {
        await createTag.mutateAsync({
          slug: row.slug,
          label: row.label,
          group: row.group || undefined,
          sortOrder: row.sortorder ? parseInt(row.sortorder, 10) : 0,
        })
        success++
      } catch {
        errors++
      }
    }
    setIsImporting(false)
    if (errors === 0) toast.success(`Imported ${success} tag${success > 1 ? 's' : ''}`)
    else toast.warning(`Imported ${success}, skipped ${errors} (duplicate slugs or errors)`)
  }

  if (tagsLoading || categoriesLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Content Taxonomy</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage categories and tags for content classification.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['tags', 'categories'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors',
              activeTab === tab
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab}
            {tab === 'tags' && (
              <span className="ml-1.5 text-xs text-muted-foreground">({tags.length})</span>
            )}
            {tab === 'categories' && (
              <span className="ml-1.5 text-xs text-muted-foreground">({categories.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Categories tab ── */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Add, rename, reorder, and remove categories at any time.
            </p>
            <Button size="sm" onClick={() => setShowNewCategory(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Category
            </Button>
          </div>

          {showNewCategory && (
            <NewCategoryForm
              createCategory={createCategory}
              onDone={() => setShowNewCategory(false)}
            />
          )}

          {categories.length === 0 && !showNewCategory ? (
            <EmptyState icon={Tag} title="No categories" description="Create your first category." />
          ) : (
            <div className="divide-y divide-border rounded-xl border">
              {categories.map((cat: any) => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  updateCategory={updateCategory}
                  deleteCategory={deleteCategory}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tags tab ── */}
      {activeTab === 'tags' && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  loading={isDeleting}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete {selected.size}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCsvImport}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                loading={isImporting}
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Import CSV
              </Button>
              <Button size="sm" onClick={() => setShowNewTag(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New Tag
              </Button>
            </div>
          </div>

          {showNewTag && (
            <NewTagForm
              createTag={createTag}
              onDone={() => setShowNewTag(false)}
            />
          )}

          {tags.length === 0 && !showNewTag ? (
            <EmptyState icon={Tag} title="No tags" description="Create your first tag." />
          ) : (
            <div className="divide-y divide-border rounded-xl border">
              {/* Select-all header */}
              <div className="flex items-center px-4 py-2 gap-3 bg-muted/30">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-border cursor-pointer accent-primary"
                />
                <span className="text-xs text-muted-foreground">
                  {selected.size > 0
                    ? `${selected.size} selected`
                    : `Select all (${tags.length})`}
                </span>
              </div>

              {tags.map((tag: any) => (
                <div key={tag.id} className="flex items-center px-4 py-3 gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(tag.id)}
                    onChange={() => toggleSelect(tag.id)}
                    className="h-4 w-4 rounded border-border cursor-pointer accent-primary shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{tag.label}</span>
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
                      onClick={() => handleDeleteTag(tag)}
                      className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete tag"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            CSV format: <span className="font-mono">slug,label,group,sortOrder</span> (header row
            required; duplicate slugs are skipped)
          </p>
        </div>
      )}
    </div>
  )
}

// ── New Category Form ──────────────────────────────────────────────────────────

function NewCategoryForm({
  createCategory,
  onDone,
}: {
  createCategory: ReturnType<typeof useAdminCreateCategory>
  onDone: () => void
}) {
  const [label, setLabel] = useState('')
  const slug = toSlug(label)

  async function handleCreate() {
    if (!slug) return
    try {
      await createCategory.mutateAsync({ slug, label: label.trim() })
      toast.success('Category created')
      onDone()
    } catch (err) {
      toast.error((err as any)?.message || 'Failed to create category')
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-muted/20 px-4 py-3">
      <div className="flex-1 min-w-0">
        <input
          autoFocus
          placeholder="Category title (e.g. Female)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          className="w-full text-sm border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {slug && (
          <span className="text-xs text-muted-foreground font-mono ml-1 mt-0.5 block">
            slug: {slug}
          </span>
        )}
      </div>
      <Button
        type="button"
        size="sm"
        loading={createCategory.isPending}
        disabled={!slug}
        onClick={handleCreate}
      >
        Create
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onDone}>
        Cancel
      </Button>
    </div>
  )
}

// ── Category Row ──────────────────────────────────────────────────────────────

type CategoryRowProps = {
  cat: any
  updateCategory: ReturnType<typeof useAdminUpdateCategory>
  deleteCategory: ReturnType<typeof useAdminDeleteCategory>
}

function CategoryRow({ cat, updateCategory, deleteCategory }: CategoryRowProps) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(cat.label)

  async function saveLabel() {
    if (label === cat.label) {
      setEditing(false)
      return
    }
    try {
      await updateCategory.mutateAsync({ categoryId: cat.id, label })
      toast.success('Category updated')
      setEditing(false)
    } catch {
      toast.error('Failed to update category')
      setLabel(cat.label)
      setEditing(false)
    }
  }

  async function toggleActive() {
    try {
      await updateCategory.mutateAsync({ categoryId: cat.id, isActive: !cat.isActive })
      toast.success(cat.isActive ? 'Category hidden' : 'Category activated')
    } catch {
      toast.error('Failed to update category')
    }
  }

  async function handleDelete() {
    try {
      await deleteCategory.mutateAsync(cat.id)
      toast.success('Category deleted')
    } catch {
      toast.error('Failed to delete category')
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">{cat.slug}</span>
        {editing ? (
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={saveLabel}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveLabel()
              if (e.key === 'Escape') {
                setLabel(cat.label)
                setEditing(false)
              }
            }}
            className="text-sm border border-border rounded px-2 py-0.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary w-40"
          />
        ) : (
          <span
            role="button"
            tabIndex={0}
            onClick={() => {
              setLabel(cat.label)
              setEditing(true)
            }}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(true)}
            className={cn(
              'text-sm font-medium cursor-pointer hover:text-primary transition-colors',
              !cat.isActive && 'text-muted-foreground line-through',
            )}
            title="Click to rename"
          >
            {cat.label}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={toggleActive}
          className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title={cat.isActive ? 'Hide category' : 'Show category'}
        >
          {cat.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={handleDelete}
          className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete category"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── New Tag Form ──────────────────────────────────────────────────────────────

function toSlug(label: string) {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function NewTagForm({
  createTag,
  onDone,
}: {
  createTag: ReturnType<typeof useAdminCreateTag>
  onDone: () => void
}) {
  const [label, setLabel] = useState('')
  const slug = toSlug(label)

  async function handleCreate() {
    if (!slug) return
    try {
      await createTag.mutateAsync({ slug, label: label.trim() })
      toast.success('Tag created')
      onDone()
    } catch (err) {
      toast.error((err as any)?.message || 'Failed to create tag')
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-muted/20 px-4 py-3">
      <div className="flex-1 min-w-0">
        <input
          autoFocus
          placeholder="Tag title (e.g. Solo Stream)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          className="w-full text-sm border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {slug && (
          <span className="text-xs text-muted-foreground font-mono ml-1 mt-0.5 block">
            slug: {slug}
          </span>
        )}
      </div>
      <Button
        type="button"
        size="sm"
        loading={createTag.isPending}
        disabled={!slug}
        onClick={handleCreate}
      >
        Create
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onDone}>
        Cancel
      </Button>
    </div>
  )
}
