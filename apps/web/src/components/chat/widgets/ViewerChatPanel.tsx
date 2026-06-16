import { ChatMessageList } from '../message/ChatMessageList'
import { ChatComposer } from '../composer/ChatComposer'
import { PinnedMessageBanner } from '../primitives/PinnedMessageBanner'
import type { ChatMessageDto, RoomEvent } from '../model/types'

export function ViewerChatPanel({
  messages,
  pinnedMessage,
  canChat,
  connected,
  sending,
  onSend,
}: {
  messages: RoomEvent[]
  pinnedMessage?: ChatMessageDto | null
  canChat: boolean
  connected: boolean
  sending: boolean
  onSend: (body: string) => Promise<void>
}) {
  return (
    <div className="flex flex-col gap-2 min-h-0 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Chat</h2>
        <span className="text-xs text-muted-foreground">
          {connected ? 'Live' : 'Connecting...'}
        </span>
      </div>
      {pinnedMessage && <PinnedMessageBanner message={pinnedMessage} variant="viewer" />}
      <ChatMessageList messages={messages} />
      <ChatComposer canChat={canChat} connected={connected} sending={sending} onSend={onSend} />
    </div>
  )
}
