import { ChatMessageList } from './ChatMessageList'
import { ChatComposer } from './ChatComposer'
import type { ChatMessageDto } from './types'

export function RoomChatPanel({
  messages,
  canChat,
  connected,
  sending,
  onSend,
}: {
  messages: ChatMessageDto[]
  canChat: boolean
  connected: boolean
  sending: boolean
  onSend: (body: string) => Promise<void>
}) {
  return (
    <div className="flex flex-col gap-2 min-h-0">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Chat</h2>
        <span className="text-xs text-muted-foreground">
          {connected ? 'Live' : 'Connecting...'}
        </span>
      </div>
      <ChatMessageList messages={messages} />
      <ChatComposer canChat={canChat} connected={connected} sending={sending} onSend={onSend} />
    </div>
  )
}
