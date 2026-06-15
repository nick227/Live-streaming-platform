import { useEffect, useRef } from 'react'
import { Pin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatMessageTime } from './formatMessageTime'
import { EVENT_FILTERS, getEventFilter, type EventFilter } from './eventFilter'
import type { ChatMessageDto } from './types'

type UserAction = 'mute' | 'unmute' | 'kick' | 'ban' | 'shoutout' | 'vip' | 'unvip'

function userLabel(user: ChatMessageDto['user']) {
  return user?.displayName ?? user?.id ?? 'Viewer'
}

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
          <Button type="button" size="sm" variant="outline" className="h-7 px-2" aria-label="Mute viewer" onClick={() => onUserAction('mute', userId)}>
            Mute
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2" aria-label="Unmute viewer" onClick={() => onUserAction('unmute', userId)}>
            Unmute
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2" aria-label="Kick viewer" onClick={() => confirmAction('kick this viewer', () => onUserAction('kick', userId))}>
            Kick
          </Button>
          <Button type="button" size="sm" variant="destructive" className="h-7 px-2" aria-label="Ban viewer" onClick={() => confirmAction('ban this viewer', () => onUserAction('ban', userId))}>
            Ban
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2" aria-label="Shoutout viewer" onClick={() => onUserAction('shoutout', userId)}>
            Shout
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2" aria-label="Mark viewer VIP" onClick={() => onUserAction('vip', userId)}>
            VIP
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2" aria-label="Remove viewer VIP" onClick={() => onUserAction('unvip', userId)}>
            UnVIP
          </Button>
        </>
      )}
      {messageId && onDeleteMessage && (
        <Button type="button" size="sm" variant="destructive" className="h-7 px-2" aria-label="Delete message" onClick={() => onDeleteMessage(messageId)}>
          Delete
        </Button>
      )}
      {messageId && onPinMessage && (
        <Button type="button" size="sm" variant="outline" className="h-7 px-2" aria-label="Pin message" onClick={() => onPinMessage(messageId)}>
          Pin
        </Button>
      )}
    </div>
  )
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
  messages: ChatMessageDto[]
  pinnedMessage?: ChatMessageDto | null
  eventFilter: EventFilter
  onEventFilterChange: (filter: EventFilter) => void
  onUserAction: (action: UserAction, userId: string) => void
  onDeleteMessage: (messageId: string) => void
  onPinMessage: (messageId: string) => void
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const visibleMessages = messages.filter(
    (message) => eventFilter === 'ALL' || getEventFilter(message) === eventFilter,
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [visibleMessages.length, visibleMessages[visibleMessages.length - 1]?.id])

  return (
    <div className="flex-1 bg-card rounded-lg border border-border flex flex-col overflow-hidden min-h-0">
      <div className="space-y-3 border-b border-border bg-muted/20 p-3">
        <div className="font-semibold text-sm uppercase tracking-wide">Event Log</div>
        <div className="flex flex-wrap gap-1">
          {EVENT_FILTERS.map((filter) => (
            <Button
              key={filter}
              type="button"
              size="sm"
              variant={eventFilter === filter ? 'default' : 'outline'}
              className="h-7 px-2"
              onClick={() => onEventFilterChange(filter)}
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {pinnedMessage && !pinnedMessage.deletedAt && (
        <div className="border-b border-primary/30 bg-primary/10 px-3 py-2 text-sm">
          <div className="flex items-center gap-2 font-medium text-primary">
            <Pin className="h-3.5 w-3.5" />
            Pinned
          </div>
          <p className="mt-1 break-words">
            <span className="font-medium">{userLabel(pinnedMessage.user)}:</span> {pinnedMessage.body}
          </p>
        </div>
      )}

      <div className="flex-1 p-4 overflow-y-auto space-y-3" aria-live="polite">
        {visibleMessages.length === 0 && (
          <div className="text-sm text-muted-foreground italic">No events yet...</div>
        )}
        {visibleMessages.map((message) => (
          <div
            key={message.id}
            className={`rounded border border-border/70 p-2 text-sm ${message.deletedAt ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-primary">{userLabel(message.user)}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {getEventFilter(message).toLowerCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatMessageTime(message.createdAt)}</span>
                </div>
                <div className="mt-1 break-words">
                  {message.deletedAt ? 'Message removed' : message.body}
                </div>
              </div>
              {!message.deletedAt && (
                <ModerationButtons
                  userId={message.user?.id ?? undefined}
                  messageId={message.id}
                  onUserAction={onUserAction}
                  onDeleteMessage={onDeleteMessage}
                  onPinMessage={onPinMessage}
                />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
