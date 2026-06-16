import { ChatMessageList } from '../message/ChatMessageList'
import { ChatComposer } from '../composer/ChatComposer'
import { ChatShell } from '../primitives/ChatShell'
import { PinnedMessageBanner } from '../primitives/PinnedMessageBanner'
import type { ChatMessageDto, RoomEvent } from '../model/types'

export function ViewerChatPanel({
  className,
  messages,
  pinnedMessage,
  vipUserIds,
  canChat,
  connected,
  sending,
  onSend,
}: {
  className?: string
  messages: RoomEvent[]
  pinnedMessage?: ChatMessageDto | null
  vipUserIds?: ReadonlySet<string>
  canChat: boolean
  connected: boolean
  sending: boolean
  onSend: (body: string) => Promise<void>
}) {
  const pinnedUserId = pinnedMessage?.user?.id
  const pinnedIsVip = Boolean(pinnedUserId && vipUserIds?.has(pinnedUserId))

  return (
    <ChatShell
      className={className}
      connected={connected}
      bannerSlot={
        pinnedMessage ? (
          <PinnedMessageBanner message={pinnedMessage} variant="viewer" isVip={pinnedIsVip} />
        ) : undefined
      }
      footer={
        <ChatComposer canChat={canChat} connected={connected} sending={sending} onSend={onSend} />
      }
    >
      <ChatMessageList messages={messages} vipUserIds={vipUserIds} />
    </ChatShell>
  )
}
