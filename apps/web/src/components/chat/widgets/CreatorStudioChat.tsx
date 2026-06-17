import { getChatFilter, type ChatFilter } from '../model/chatFilter'
import { formatMessageTime } from '../model/formatMessageTime'
import type { ChatItem, ChatMessageDto } from '../model/types'
import type { ModerationHandlers } from '../moderation/types'
import { ChatComposer } from '../composer/ChatComposer'
import { ChatMessageList } from '../message/ChatMessageList'
import { ChatConnectionStatus } from '../primitives/ChatConnectionStatus'
import { ChatShell } from '../primitives/ChatShell'
import { ChatStatusBanner } from '../primitives/ChatStatusBanner'
import { EventFilterTabs } from '../primitives/EventFilterTabs'
import { PinnedMessageBanner } from '../primitives/PinnedMessageBanner'

export function CreatorStudioChat({
  messages,
  pinnedMessage,
  slowModeSeconds = 0,
  mutedUserIds,
  vipUserIds,
  customEmotes = [],
  connected,
  sending,
  eventFilter,
  onEventFilterChange,
  onSend,
  onUserAction,
  onDeleteMessage,
  onPinMessage,
}: {
  messages: ChatItem[]
  pinnedMessage?: ChatMessageDto | null
  slowModeSeconds?: number
  mutedUserIds?: ReadonlySet<string>
  vipUserIds?: ReadonlySet<string>
  customEmotes?: string[]
  connected: boolean
  sending: boolean
  eventFilter: ChatFilter
  onEventFilterChange: (filter: ChatFilter) => void
  onSend: (body: string) => Promise<void>
} & Required<Pick<ModerationHandlers, 'onUserAction' | 'onDeleteMessage' | 'onPinMessage'>>) {
  const visibleMessages =
    eventFilter === 'CHAT'
      ? messages
      : messages.filter((chatItem) => getChatFilter(chatItem) === eventFilter)

  const pinnedUserId = pinnedMessage?.user?.id
  const pinnedIsVip = Boolean(pinnedUserId && vipUserIds?.has(pinnedUserId))
  const tipsSummary =
    eventFilter === 'TIPS'
      ? messages.reduce(
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
    <ChatShell
      connected={connected}
      headerSlot={
        <div className="flex items-center justify-between gap-3 shrink-0 px-1">
          <div className="flex items-center justify-between gap-2">
            <EventFilterTabs value={eventFilter} onChange={onEventFilterChange} />
            <ChatConnectionStatus connected={connected} />
          </div>
        </div>
      }
      bannerSlot={
        <div className="space-y-2 shrink-0">
          {(eventFilter === 'TIPS') && tipsSummary && (
            <div className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span>
                  Total: <span className="font-semibold text-foreground">{tipsSummary.totalTokens}</span>
                </span> 
                {messages[messages.length - 1]?.message.createdAt && (
                  <span>
                    Latest: {formatMessageTime(messages[messages.length - 1]!.message.createdAt)}
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

          <ChatStatusBanner slowModeSeconds={slowModeSeconds} />

          {pinnedMessage && (
            <PinnedMessageBanner message={pinnedMessage} variant="studio" isVip={pinnedIsVip} />
          )}
        </div>
      }
      footer={
        <ChatComposer
          canChat
          connected={connected}
          sending={sending}
          customEmotes={customEmotes}
          onSend={onSend}
        />
      }
    >
      <ChatMessageList
        messages={visibleMessages}
        variant="studio"
        mutedUserIds={mutedUserIds}
        vipUserIds={vipUserIds}
        moderation={{ onUserAction, onDeleteMessage, onPinMessage }}
      />
    </ChatShell>
  )
}
