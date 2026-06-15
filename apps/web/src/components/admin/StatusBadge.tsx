import { cn } from '@/lib/utils'

const COLORS: Record<string, string> = {
  // Room statuses
  DRAFT: 'bg-muted text-muted-foreground',
  LIVE: 'bg-destructive/15 text-destructive',
  ENDED: 'bg-muted text-muted-foreground',
  HIDDEN: 'bg-muted text-muted-foreground',
  // User / creator statuses
  ACTIVE: 'bg-green-500/15 text-green-600 dark:text-green-400',
  OFFLINE: 'bg-muted text-muted-foreground',
  SUSPENDED: 'bg-destructive/15 text-destructive',
  DELETED: 'bg-muted text-muted-foreground',
  // Payment statuses
  PENDING: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  APPROVED: 'bg-green-500/15 text-green-600 dark:text-green-400',
  SUCCESS: 'bg-green-500/15 text-green-600 dark:text-green-400',
  FAILED: 'bg-destructive/15 text-destructive',
  DECLINED: 'bg-muted text-muted-foreground',
  REFUNDED: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  CHARGEBACK: 'bg-destructive/15 text-destructive',
  MANUAL_REVIEW: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  // Private session statuses
  REQUESTED: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  ACCEPTED: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  IN_PROGRESS: 'bg-primary/15 text-primary',
  COMPLETED: 'bg-green-500/15 text-green-600 dark:text-green-400',
  FORCE_ENDED: 'bg-destructive/15 text-destructive',
  // Report statuses
  OPEN: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  REVIEWED: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  ACTIONED: 'bg-green-500/15 text-green-600 dark:text-green-400',
  DISMISSED: 'bg-muted text-muted-foreground',
  // User roles
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
