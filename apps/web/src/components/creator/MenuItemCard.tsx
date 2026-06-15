import { Pencil, Trash2, Coins } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface MenuItemCardProps {
  item: {
    id: string
    label: string
    description?: string | null
    tokenAmount: number
    isActive: boolean
  }
  onEdit?: () => void
  onDelete?: () => void
  isDeleting?: boolean
}

export function MenuItemCard({ item, onEdit, onDelete, isDeleting }: MenuItemCardProps) {
  return (
    <Card className={cn(!item.isActive && 'opacity-50')}>
      <CardContent className="py-4 flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{item.label}</span>
            {!item.isActive && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">inactive</span>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
          )}
          <span className="flex items-center gap-1 text-xs text-primary font-medium">
            <Coins className="h-3 w-3" />
            {item.tokenAmount.toLocaleString()} tokens
          </span>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex gap-2 shrink-0">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={onDelete} loading={isDeleting}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
