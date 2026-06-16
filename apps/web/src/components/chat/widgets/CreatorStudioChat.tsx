import { useChatScroll } from '../hooks/useChatScroll'
import { userLabel } from '../model/display'
import { getEventFilter, type EventFilter } from '../model/eventFilter'
import { formatMessageTime } from '../model/formatMessageTime'
import type { ChatMessageDto, RoomEvent } from '../model/types'
import { InlineModerationActions } from '../moderation/InlineModerationActions'
import type { ModerationHandlers } from '../moderation/types'
import { EventFilterTabs } from '../primitives/EventFilterTabs'
import { PinnedMessageBanner } from '../primitives/PinnedMessageBanner'

const EVENT_TYPE_STYLES: Record<string, string> = {
  chat: 'bg-muted/60 text-muted-foreground',
  tip: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  event: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
}

export function CreatorStudioChat({
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
} & Required<Pick<ModerationHandlers, 'onUserAction' | 'onDeleteMessage' | 'onPinMessage'>>) {
  const visibleMessages = messages.filter(
    (event) => eventFilter === 'ALL' || getEventFilter(event) === eventFilter,
  )

  const lastMessageId = visibleMessages[visibleMessages.length - 1]?.message.id
  const { scrollRef, bottomRef } = useChatScroll([visibleMessages.length, lastMessageId])

  return (
    <div className="flex-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden min-h-0">
      <div className="border-b border-border bg-muted/20 px-3 py-2.5 shrink-0">
        <EventFilterTabs value={eventFilter} onChange={onEventFilterChange} />
      </div>

      {pinnedMessage && <PinnedMessageBanner message={pinnedMessage} variant="studio" />}

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
              <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${typeStyle}`}>
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

              {!isDeleted && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                  <InlineModerationActions
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
