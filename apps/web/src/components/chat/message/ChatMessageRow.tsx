import type { ReactNode } from 'react'
import { Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMessageTime } from '../model/formatMessageTime'
import { getEventFilter } from '../model/eventFilter'
import type { RoomEvent } from '../model/types'
import { ChatUsername } from './ChatUsername'
import { EVENT_TYPE_STYLES } from './eventTypeStyles'

function viewerRowClassName(type: RoomEvent['type']) {
  if (type === 'tip') return 'border-l-2 border-l-amber-500 bg-amber-500/10 border-amber-500/20'
  if (type === 'moderation') return 'bg-destructive/10 border-destructive/30'
  if (type === 'system') return 'bg-muted/40 border-border/50'
  return 'hover:bg-muted/30 border-transparent'
}

export function ChatMessageRow({
  event,
  variant = 'viewer',
  showTimestamp = false,
  isVip = false,
  isHighlight = false,
  moderationSlot,
}: {
  event: RoomEvent
  variant?: 'viewer' | 'studio'
  showTimestamp?: boolean
  isVip?: boolean
  isHighlight?: boolean
  moderationSlot?: ReactNode
}) {
  const removed = Boolean(event.message.deletedAt)
  const isTip = event.type === 'tip'

  if (variant === 'studio') {
    const typeKey = getEventFilter(event).toLowerCase()
    const typeStyle = EVENT_TYPE_STYLES[typeKey] ?? EVENT_TYPE_STYLES.chat

    return (
      <div
        className={cn(
          'group flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors',
          isTip ? 'bg-amber-500/8 ring-1 ring-amber-500/15' : 'hover:bg-muted/40',
          isHighlight && isTip && 'chat-tip-enter',
          removed && 'opacity-40',
        )}
      >
        <span className={cn('mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide', typeStyle)}>
          {typeKey}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <ChatUsername
              user={event.message.user}
              messageType={event.message.type}
              isVip={isVip}
              nameClassName="text-xs font-bold text-primary leading-tight"
            />
            <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
              {formatMessageTime(event.message.createdAt)}
            </span>
          </div>
          <p className="text-sm break-words leading-snug mt-0.5">
            {removed ? (
              <span className="italic text-muted-foreground">Message removed</span>
            ) : (
              <>
                {event.message.body}
                {isTip && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 font-bold text-amber-600 dark:text-amber-400">
                    <Coins className="h-3.5 w-3.5" />
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
        'rounded-lg border px-2.5 py-1.5 text-sm transition-colors',
        viewerRowClassName(event.type),
        isHighlight && isTip && 'chat-tip-enter',
        removed && 'opacity-60',
      )}
    >
      <div className="flex items-baseline gap-2 min-w-0">
        <span className="shrink-0">
          <ChatUsername
            user={event.message.user}
            messageType={event.message.type}
            isVip={isVip}
            nameClassName={cn(
              'font-medium',
              isTip ? 'text-amber-700 dark:text-amber-400' : 'text-primary',
            )}
          />
          <span className="text-muted-foreground">:</span>
        </span>
        <span className={cn('break-words min-w-0', event.type === 'system' && 'text-muted-foreground italic')}>
          {removed ? 'Message removed' : event.message.body}
          {isTip && !removed && (
            <span className="ml-2 inline-flex items-center gap-0.5 font-bold text-amber-600 dark:text-amber-400">
              <Coins className="h-3.5 w-3.5" />
              {event.amountTokens}
            </span>
          )}
        </span>
        {showTimestamp && (
          <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
            {formatMessageTime(event.message.createdAt)}
          </span>
        )}
      </div>
    </div>
  )
}
