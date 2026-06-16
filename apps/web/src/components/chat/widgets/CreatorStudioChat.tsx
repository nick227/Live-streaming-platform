import { getEventFilter, type EventFilter } from '../model/eventFilter'
import type { ChatMessageDto, RoomEvent } from '../model/types'
import type { ModerationHandlers } from '../moderation/types'
import { ChatMessageList } from '../message/ChatMessageList'
import { EventFilterTabs } from '../primitives/EventFilterTabs'
import { PinnedMessageBanner } from '../primitives/PinnedMessageBanner'

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

  return (
    <div className="flex-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden min-h-0">
      <div className="border-b border-border bg-muted/20 px-3 py-2.5 shrink-0">
        <EventFilterTabs value={eventFilter} onChange={onEventFilterChange} />
      </div>

      {pinnedMessage && <PinnedMessageBanner message={pinnedMessage} variant="studio" />}

      <ChatMessageList
        messages={visibleMessages}
        variant="studio"
        moderation={{ onUserAction, onDeleteMessage, onPinMessage }}
      />
    </div>
  )
}
