import { ChatMessageList } from '../message/ChatMessageList'
import { ChatComposer } from '../composer/ChatComposer'
import { ChatAccessBanner } from '../primitives/ChatAccessBanner'
import { ChatShell } from '../primitives/ChatShell'
import { ChatStatusBanner } from '../primitives/ChatStatusBanner'
import { PinnedMessageBanner } from '../primitives/PinnedMessageBanner'
import type { ChatItem, ChatMessageDto } from '../model/types'

export function ViewerChatPanel({
  className,
  messages,
  pinnedMessage,
  slowModeSeconds = 0,
  vipUserIds,
  customEmotes = [],
  canChat,
  connected,
  sending,
  onSend,
}: {
  className?: string
  messages: ChatItem[]
  pinnedMessage?: ChatMessageDto | null
  slowModeSeconds?: number
  vipUserIds?: ReadonlySet<string>
  customEmotes?: string[]
  canChat: boolean
  connected: boolean
  sending: boolean
  onSend: (body: string) => Promise<void>
}) {
  const pinnedUserId = pinnedMessage?.user?.id
  const pinnedIsVip = Boolean(pinnedUserId && vipUserIds?.has(pinnedUserId))
  const hasBanners = !canChat || slowModeSeconds > 0 || pinnedMessage

  return (
    <ChatShell
      className={className}
      connected={connected}
      bannerSlot={
        hasBanners ? (
          <div className="space-y-2 shrink-0">
            <ChatAccessBanner canChat={canChat} />
            <ChatStatusBanner slowModeSeconds={slowModeSeconds} />
            {pinnedMessage && (
              <PinnedMessageBanner message={pinnedMessage} variant="viewer" isVip={pinnedIsVip} />
            )}
          </div>
        ) : undefined
      }
      footer={
        <ChatComposer
          canChat={canChat}
          connected={connected}
          sending={sending}
          slowModeSeconds={slowModeSeconds}
          customEmotes={customEmotes}
          onSend={onSend}
        />
      }
    >
      <ChatMessageList messages={messages} vipUserIds={vipUserIds} />
    </ChatShell>
  )
}
