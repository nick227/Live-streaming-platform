import { ChatMessageList } from '../message/ChatMessageList'
import { ChatComposer } from '../composer/ChatComposer'
import { ChatShell } from '../primitives/ChatShell'
import { PinnedMessageBanner } from '../primitives/PinnedMessageBanner'
import type { ChatMessageDto, RoomEvent } from '../model/types'

export function ViewerChatPanel({
  className,
  messages,
  pinnedMessage,
  canChat,
  connected,
  sending,
  onSend,
}: {
  className?: string
  messages: RoomEvent[]
  pinnedMessage?: ChatMessageDto | null
  canChat: boolean
  connected: boolean
  sending: boolean
  onSend: (body: string) => Promise<void>
}) {
  return (
    <ChatShell
      className={className}
      connected={connected}
      bannerSlot={pinnedMessage ? <PinnedMessageBanner message={pinnedMessage} variant="viewer" /> : undefined}
      footer={
        <ChatComposer canChat={canChat} connected={connected} sending={sending} onSend={onSend} />
      }
    >
      <ChatMessageList messages={messages} />
    </ChatShell>
  )
}
