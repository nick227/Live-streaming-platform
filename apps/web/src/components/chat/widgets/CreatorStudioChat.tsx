import { getChatFilter, type ChatFilter } from '../model/chatFilter'
import { formatMessageTime } from '../model/formatMessageTime'
import type { ChatItem, ChatMessageDto } from '../model/types'
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
  messages: ChatItem[]
  pinnedMessage?: ChatMessageDto | null
  slowModeSeconds?: number
  vipUserIds?: ReadonlySet<string>
  eventFilter: ChatFilter
  onEventFilterChange: (filter: ChatFilter) => void
} & Required<Pick<ModerationHandlers, 'onUserAction' | 'onDeleteMessage' | 'onPinMessage'>>) {
  const visibleMessages = messages.filter(
    (chatItem) => getChatFilter(chatItem) === eventFilter,
  )

  const pinnedUserId = pinnedMessage?.user?.id
  const pinnedIsVip = Boolean(pinnedUserId && vipUserIds?.has(pinnedUserId))
  const tipsSummary =
    eventFilter === 'TIPS'
      ? visibleMessages.reduce(
          (acc, item) => {
            if (item.type !== 'tip') return acc
            acc.totalTokens += item.amountTokens
            const userId = item.message.user?.id ?? 'anonymous'
            const current = acc.byUser.get(userId) ?? {
              displayName: item.message.user?.displayName ?? 'Anonymous',
              tokens: 0,
            }
            current.tokens += item.amountTokens
            acc.byUser.set(userId, current)
            return acc
          },
          { totalTokens: 0, byUser: new Map<string, { displayName: string; tokens: number }>() },
        )
      : null
  const topTippers =
    tipsSummary === null
      ? []
      : Array.from(tipsSummary.byUser.values())
          .sort((a, b) => b.tokens - a.tokens)
          .slice(0, 3)

  return (
    <div className="flex-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden min-h-0 shadow-sm">
      <div className="border-b border-border bg-muted/20 px-3 py-2.5 shrink-0">
        <EventFilterTabs value={eventFilter} onChange={onEventFilterChange} />
      </div>

      {eventFilter === 'TIPS' && tipsSummary && (
        <div className="border-b border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground shrink-0">
          <div className="flex items-center gap-3">
            <span>
              Total: <span className="font-semibold text-foreground">{tipsSummary.totalTokens}</span>
            </span>
            {visibleMessages[visibleMessages.length - 1]?.message.createdAt && (
              <span>
                Latest: {formatMessageTime(visibleMessages[visibleMessages.length - 1]!.message.createdAt)}
              </span>
            )}
          </div>
          {topTippers.length > 0 && (
            <div className="mt-1 truncate">
              Top: {topTippers.map((tipper) => `${tipper.displayName} (${tipper.tokens})`).join(' · ')}
            </div>
          )}
        </div>
      )}

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
