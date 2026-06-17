import type { ReactNode } from 'react'
import { Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMessageTime } from '../model/formatMessageTime'
import { getChatFilter } from '../model/chatFilter'
import type { ChatItem } from '../model/types'
import { BUILT_IN_GIF_BY_TOKEN } from '../composer/builtIns'
import { ChatUsername } from './ChatUsername'

function viewerRowClassName(type: ChatItem['type']) {
  if (type === 'tip') return 'border-l-2 border-l-amber-500 bg-amber-500/10 border-amber-500/20'
  if (type === 'moderation') return 'bg-destructive/10 border-destructive/30'
  if (type === 'system') return 'bg-muted/40 border-border/50'
  return 'hover:bg-muted/30 border-transparent'
}

function renderMessageBody(body: string) {
  const parts = body.split(/(\[gif:[a-z-]+\])/g).filter(Boolean)
  return parts.map((part, index) => {
    const gif = BUILT_IN_GIF_BY_TOKEN.get(part)
    if (!gif) return <span key={`${part}-${index}`}>{part}</span>

    return (
      <span
        key={gif.token}
        className={cn(
          'mx-1 inline-flex min-w-20 items-center justify-center rounded-md border border-amber-500/30',
          'bg-gradient-to-r from-amber-500/20 via-primary/15 to-amber-500/20 px-2 py-1',
          'text-[10px] font-black uppercase tracking-widest text-amber-700 shadow-sm',
          'animate-pulse dark:text-amber-300',
        )}
        title={gif.label}
      >
        {gif.title}
      </span>
    )
  })
}

export function ChatMessageRow({
  event,
  variant = 'viewer',
  showTimestamp = false,
  isVip = false,
  isHighlight = false,
  moderationSlot,
}: {
  event: ChatItem
  variant?: 'viewer' | 'studio'
  showTimestamp?: boolean
  isVip?: boolean
  isHighlight?: boolean
  moderationSlot?: ReactNode
}) {
  const removed = Boolean(event.message.deletedAt)
  const isTip = event.type === 'tip'

  if (variant === 'studio') {
    const typeKey = getChatFilter(event).toLowerCase()

    return (
      <div
        className={cn(
          'group flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors',
          isTip ? 'bg-amber-500/8 ring-1 ring-amber-500/15' : 'hover:bg-muted/40',
          isHighlight && isTip && 'chat-tip-enter',
          removed && 'opacity-40',
        )}
      >

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap justify-between">
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
          <p className="text-lg break-words leading-snug mt-0.5">
            {removed ? (
              <span className="italic text-muted-foreground">Message removed</span>
            ) : (
              <>
                {renderMessageBody(event.message.body)}
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
          {removed ? 'Message removed' : renderMessageBody(event.message.body)}
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
