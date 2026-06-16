import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { displayName, userLabel } from '../model/display'
import { getEventFilter } from '../model/eventFilter'
import { formatMessageTime } from '../model/formatMessageTime'
import type { RoomEvent } from '../model/types'
import { EVENT_TYPE_STYLES } from './eventTypeStyles'

function viewerRowClassName(type: RoomEvent['type']) {
  if (type === 'tip') return 'bg-amber-500/10 border-amber-500/30'
  if (type === 'moderation') return 'bg-destructive/10 border-destructive/30'
  if (type === 'system') return 'bg-muted/40 border-border/50'
  return 'border-transparent'
}

export function ChatMessageRow({
  event,
  variant = 'viewer',
  showTimestamp = false,
  moderationSlot,
}: {
  event: RoomEvent
  variant?: 'viewer' | 'studio'
  showTimestamp?: boolean
  moderationSlot?: ReactNode
}) {
  const removed = Boolean(event.message.deletedAt)

  if (variant === 'studio') {
    const typeKey = getEventFilter(event).toLowerCase()
    const typeStyle = EVENT_TYPE_STYLES[typeKey] ?? EVENT_TYPE_STYLES.chat

    return (
      <div
        className={cn(
          'group flex items-start gap-2 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted/40',
          removed && 'opacity-40',
        )}
      >
        <span className={cn('mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide', typeStyle)}>
          {typeKey}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-bold text-primary leading-tight">
              {userLabel(event.message.user)}
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {formatMessageTime(event.message.createdAt)}
            </span>
          </div>
          <p className="text-sm break-words leading-snug mt-0.5">
            {removed ? (
              <span className="italic text-muted-foreground">Message removed</span>
            ) : (
              <>
                {event.message.body}
                {event.type === 'tip' && (
                  <span className="ml-1.5 font-bold text-amber-500">
                    +{event.amountTokens}
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        {!removed && moderationSlot && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
            {moderationSlot}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded border px-2 py-1.5 text-sm',
        viewerRowClassName(event.type),
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
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {formatMessageTime(event.message.createdAt)}
          </span>
        )}
      </div>
    </div>
  )
}
