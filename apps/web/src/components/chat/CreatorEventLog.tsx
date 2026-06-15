import { useEffect, useRef } from 'react'
import { Pin, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatMessageTime } from './formatMessageTime'
import { EVENT_FILTERS, getEventFilter, type EventFilter } from './eventFilter'
import type { ChatMessageDto, RoomEvent } from './types'

type UserAction = 'mute' | 'unmute' | 'kick' | 'ban' | 'shoutout' | 'vip' | 'unvip'

function userLabel(user: ChatMessageDto['user']) {
  return user?.displayName ?? user?.id ?? 'Viewer'
}

// Full moderation button bar — used in viewer list and pending requests
export function ModerationButtons({
  userId,
  messageId,
  onUserAction,
  onDeleteMessage,
  onPinMessage,
}: {
  userId?: string
  messageId?: string
  onUserAction: (action: UserAction, userId: string) => void
  onDeleteMessage?: (messageId: string) => void
  onPinMessage?: (messageId: string) => void
}) {
  function confirmAction(label: string, action: () => void) {
    if (window.confirm(`Confirm: ${label}?`)) action()
  }

  return (
    <div className="flex flex-wrap gap-1">
      {userId && (
        <>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onUserAction('mute', userId)}>
            Mute
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onUserAction('unmute', userId)}>
            Unmute
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => confirmAction('kick this viewer', () => onUserAction('kick', userId))}>
            Kick
          </Button>
          <Button type="button" size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => confirmAction('ban this viewer', () => onUserAction('ban', userId))}>
            Ban
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onUserAction('vip', userId)}>
            VIP
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onUserAction('unvip', userId)}>
            UnVIP
          </Button>
        </>
      )}
      {messageId && onDeleteMessage && (
        <Button type="button" size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => onDeleteMessage(messageId)}>
          Del
        </Button>
      )}
      {messageId && onPinMessage && (
        <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onPinMessage(messageId)}>
          Pin
        </Button>
      )}
    </div>
  )
}

// Compact inline moderation — hover-revealed in the event log
function InlineMod({
  userId,
  messageId,
  onUserAction,
  onDeleteMessage,
  onPinMessage,
}: {
  userId?: string
  messageId?: string
  onUserAction: (action: UserAction, userId: string) => void
  onDeleteMessage?: (messageId: string) => void
  onPinMessage?: (messageId: string) => void
}) {
  function confirmAction(label: string, action: () => void) {
    if (window.confirm(`Confirm: ${label}?`)) action()
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      {userId && (
        <>
          <button
            className="h-6 px-1.5 rounded text-[10px] font-medium bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => onUserAction('mute', userId)}
            title="Mute"
          >
            Mute
          </button>
          <button
            className="h-6 px-1.5 rounded text-[10px] font-medium bg-muted hover:bg-red-600 hover:text-white text-muted-foreground transition-colors"
            onClick={() => confirmAction('kick this viewer', () => onUserAction('kick', userId))}
            title="Kick"
          >
            Kick
          </button>
          <button
            className="h-6 px-1.5 rounded text-[10px] font-medium bg-muted hover:bg-red-700 hover:text-white text-muted-foreground transition-colors"
            onClick={() => confirmAction('ban this viewer', () => onUserAction('ban', userId))}
            title="Ban"
          >
            Ban
          </button>
          <button
            className="h-6 px-1.5 rounded text-[10px] font-medium bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-colors"
            onClick={() => onUserAction('vip', userId)}
            title="VIP"
          >
            VIP
          </button>
        </>
      )}
      {messageId && onDeleteMessage && (
        <button
          className="h-6 px-1.5 rounded text-[10px] font-medium bg-muted hover:bg-red-600 hover:text-white text-muted-foreground transition-colors"
          onClick={() => onDeleteMessage(messageId)}
          title="Delete message"
        >
          Del
        </button>
      )}
      {messageId && onPinMessage && (
        <button
          className="h-6 w-6 rounded flex items-center justify-center bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onPinMessage(messageId)}
          title="Pin message"
        >
          <Pin className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

const EVENT_TYPE_STYLES: Record<string, string> = {
  chat: 'bg-muted/60 text-muted-foreground',
  tip: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  event: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
}

export function CreatorEventLog({
  messages,
  pinnedMessage,
  eventFilter,
  onEventFilterChange,
  onUserAction,
  onDeleteMessage,
  onPinMessage,
}: {
  messages: RoomEvent[]
  pinnedMessage?: ChatMessageDto | null
  eventFilter: EventFilter
  onEventFilterChange: (filter: EventFilter) => void
  onUserAction: (action: UserAction, userId: string) => void
  onDeleteMessage: (messageId: string) => void
  onPinMessage: (messageId: string) => void
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isNearBottom = useRef(true)

  const visibleMessages = messages.filter(
    (event) => eventFilter === 'ALL' || getEventFilter(event) === eventFilter,
  )

  // Track whether user has scrolled up
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => {
      isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [])

  // Auto-scroll only when near bottom
  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [visibleMessages.length, visibleMessages[visibleMessages.length - 1]?.message.id])

  return (
    <div className="flex-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden min-h-0">
      {/* Header + filters */}
      <div className="border-b border-border bg-muted/20 px-3 py-2.5 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Event Log
          </span>
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex flex-wrap gap-1">
          {EVENT_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onEventFilterChange(filter)}
              className={
                eventFilter === filter
                  ? 'h-6 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-primary text-primary-foreground'
                  : 'h-6 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-muted text-muted-foreground hover:text-foreground transition-colors'
              }
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned message */}
      {pinnedMessage && !pinnedMessage.deletedAt && (
        <div className="border-b border-primary/20 bg-primary/8 px-3 py-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
            <Pin className="h-3 w-3" /> Pinned
          </div>
          <p className="text-sm break-words">
            <span className="font-semibold">{userLabel(pinnedMessage.user)}:</span>{' '}
            {pinnedMessage.body}
          </p>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1.5"
        aria-live="polite"
      >
        {visibleMessages.length === 0 && (
          <div className="text-sm text-muted-foreground italic py-4 text-center">
            No events yet…
          </div>
        )}
        {visibleMessages.map((event) => {
          const typeKey = getEventFilter(event).toLowerCase()
          const typeStyle = EVENT_TYPE_STYLES[typeKey] ?? EVENT_TYPE_STYLES.chat
          const isDeleted = !!event.message.deletedAt

          return (
            <div
              key={event.message.id}
              className={`group flex items-start gap-2 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted/40 ${isDeleted ? 'opacity-40' : ''}`}
            >
              {/* Left: type badge */}
              <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${typeStyle}`}>
                {typeKey}
              </span>

              {/* Center: content */}
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
                  {isDeleted ? (
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

              {/* Right: hover-reveal moderation */}
              {!isDeleted && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                  <InlineMod
                    userId={event.message.user?.id ?? undefined}
                    messageId={event.message.id}
                    onUserAction={onUserAction}
                    onDeleteMessage={onDeleteMessage}
                    onPinMessage={onPinMessage}
                  />
                </div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
