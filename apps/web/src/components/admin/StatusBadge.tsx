import { cn } from '@/lib/utils'

const COLORS: Record<string, string> = {
  LIVE: 'bg-destructive/15 text-destructive',
  ACTIVE: 'bg-green-500/15 text-green-600 dark:text-green-400',
  OFFLINE: 'bg-muted text-muted-foreground',
  ENDED: 'bg-muted text-muted-foreground',
  PENDING: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  SUSPENDED: 'bg-destructive/15 text-destructive',
  DELETED: 'bg-muted text-muted-foreground',
  APPROVED: 'bg-green-500/15 text-green-600 dark:text-green-400',
  HIDDEN: 'bg-muted text-muted-foreground',
  SUCCESS: 'bg-green-500/15 text-green-600 dark:text-green-400',
  FAILED: 'bg-destructive/15 text-destructive',
  REFUNDED: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  CHARGEBACK: 'bg-destructive/15 text-destructive',
  REQUESTED: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  ACCEPTED: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  DECLINED: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-primary/15 text-primary',
  COMPLETED: 'bg-green-500/15 text-green-600 dark:text-green-400',
  OPEN: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  REVIEWED: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  ACTIONED: 'bg-green-500/15 text-green-600 dark:text-green-400',
  DISMISSED: 'bg-muted text-muted-foreground',
  VIEWER: 'bg-muted text-muted-foreground',
  CREATOR: 'bg-primary/15 text-primary',
  ADMIN: 'bg-destructive/15 text-destructive',
  MODERATOR: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full',
      COLORS[status] ?? 'bg-muted text-muted-foreground',
      className,
    )}>
      {status}
    </span>
  )
}
