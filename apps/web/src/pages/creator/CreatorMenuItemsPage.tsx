import { Link, useNavigate } from 'react-router-dom'
import { useCreatorMenuItems, useDeleteCreatorMenuItem } from '@streamyolo/sdk'
import { MenuItemCard } from '@/components/creator/MenuItemCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Utensils, Plus } from 'lucide-react'
import { toast } from 'sonner'

export function CreatorMenuItemsPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useCreatorMenuItems()
  const deleteMutation = useDeleteCreatorMenuItem()

  if (isLoading) return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  )

  const items: any[] = (data?.data as any[]) ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tip Menu</h1>
        <Button asChild size="sm">
          <Link to="/creator/menu-items/new">
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title="No menu items yet"
          description="Add tip menu items so viewers can send you themed tips."
          action={{ label: 'Add First Item', onClick: () => navigate('/creator/menu-items/new') }}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onEdit={() => navigate(`/creator/menu-items/${item.id}`)}
              onDelete={async () => {
                try {
                  await deleteMutation.mutateAsync(item.id)
                  toast.success('Item deleted')
                } catch {
                  toast.error('Failed to delete item')
                }
              }}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === item.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
