import { ChatMessageList } from './ChatMessageList'
import { ChatComposer } from './ChatComposer'
import type { ChatMessageDto, RoomEvent } from './types'

export function RoomChatPanel({
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
      {pinnedMessage && !pinnedMessage.deletedAt && (
        <div className="rounded border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
          <span className="font-medium text-primary">Pinned: </span>
          <span className="break-words">{pinnedMessage.body}</span>
        </div>
      )}
      <ChatMessageList messages={messages} />
      <ChatComposer canChat={canChat} connected={connected} sending={sending} onSend={onSend} />
    </div>
  )
}
