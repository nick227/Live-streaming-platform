import { cn } from '@/lib/utils'
import { formatMessageTime } from './formatMessageTime'
import type { RoomEvent } from './types'

function displayName(event: RoomEvent) {
  return event.message.user?.displayName ?? 'System'
}

function rowClassName(type: RoomEvent['type']) {
  if (type === 'tip') return 'bg-amber-500/10 border-amber-500/30'
  if (type === 'moderation') return 'bg-destructive/10 border-destructive/30'
  if (type === 'system') return 'bg-muted/40 border-border/50'
  return 'border-transparent'
}

export function ChatMessageRow({ event, showTimestamp = false }: { event: RoomEvent; showTimestamp?: boolean }) {
  const removed = Boolean(event.message.deletedAt)

  return (
    <div
      className={cn(
        'rounded border px-2 py-1.5 text-sm',
        rowClassName(event.type),
        removed && 'opacity-60',
      )}
    >
      <div className="flex items-baseline gap-2 min-w-0">
        <span
          className={cn(
            'font-medium shrink-0',
            event.type === 'tip' ? 'text-amber-600 dark:text-amber-400' : 'text-primary',
          )}
        >
          {displayName(event)}:
        </span>
        <span className={cn('break-words min-w-0', event.type === 'system' && 'text-muted-foreground italic')}>
          {removed ? 'Message removed' : event.message.body}
          {event.type === 'tip' && !removed && (
            <span className="ml-2 font-bold text-amber-500">
              ({event.amountTokens} tokens)
            </span>
          )}
        </span>
        {showTimestamp && (
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">{formatMessageTime(event.message.createdAt)}</span>
        )}
      </div>
    </div>
  )
}
