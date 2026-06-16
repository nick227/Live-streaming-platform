import { getEventFilter, type EventFilter } from '../model/eventFilter'
import type { ChatMessageDto, RoomEvent } from '../model/types'
import type { ModerationHandlers } from '../moderation/types'
import { ChatMessageList } from '../message/ChatMessageList'
import { ChatStatusBanner } from '../primitives/ChatStatusBanner'
import { EventFilterTabs } from '../primitives/EventFilterTabs'
import { PinnedMessageBanner } from '../primitives/PinnedMessageBanner'

export function CreatorStudioChat({
  messages,
  pinnedMessage,
  slowModeSeconds = 0,
  vipUserIds,
  eventFilter,
  onEventFilterChange,
  onUserAction,
  onDeleteMessage,
  onPinMessage,
}: {
  messages: RoomEvent[]
  pinnedMessage?: ChatMessageDto | null
  slowModeSeconds?: number
  vipUserIds?: ReadonlySet<string>
  eventFilter: EventFilter
  onEventFilterChange: (filter: EventFilter) => void
} & Required<Pick<ModerationHandlers, 'onUserAction' | 'onDeleteMessage' | 'onPinMessage'>>) {
  const visibleMessages = messages.filter(
    (event) => eventFilter === 'ALL' || getEventFilter(event) === eventFilter,
  )

  const pinnedUserId = pinnedMessage?.user?.id
  const pinnedIsVip = Boolean(pinnedUserId && vipUserIds?.has(pinnedUserId))

  return (
    <div className="flex-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden min-h-0 shadow-sm">
      <div className="border-b border-border bg-muted/20 px-3 py-2.5 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Event log</p>
        <EventFilterTabs value={eventFilter} onChange={onEventFilterChange} />
      </div>

      {slowModeSeconds > 0 && (
        <div className="px-3 pt-2 shrink-0">
          <ChatStatusBanner slowModeSeconds={slowModeSeconds} />
        </div>
      )}

      {pinnedMessage && (
        <PinnedMessageBanner message={pinnedMessage} variant="studio" isVip={pinnedIsVip} />
      )}

      <ChatMessageList
        messages={visibleMessages}
        variant="studio"
        vipUserIds={vipUserIds}
        moderation={{ onUserAction, onDeleteMessage, onPinMessage }}
      />
    </div>
  )
}
