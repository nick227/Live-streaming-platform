import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { ChatScrollArea } from '../primitives/ChatScrollArea'
import type { RoomEvent } from '../model/types'
import { InlineModerationActions } from '../moderation/InlineModerationActions'
import type { ModerationHandlers } from '../moderation/types'
import { ChatEmptyState } from './ChatEmptyState'
import { ChatMessageRow } from './ChatMessageRow'

type ChatMessageListProps = {
  messages: RoomEvent[]
  variant?: 'viewer' | 'studio'
  className?: string
  emptyMessage?: string
  vipUserIds?: ReadonlySet<string>
  moderation?: Required<Pick<ModerationHandlers, 'onUserAction' | 'onDeleteMessage' | 'onPinMessage'>>
}

function defaultEmptyMessage(variant: 'viewer' | 'studio') {
  return variant === 'studio' ? 'No events yet…' : 'No messages yet. Say hello!'
}

function isVipUser(userId: string | undefined, vipUserIds?: ReadonlySet<string>) {
  return Boolean(userId && vipUserIds?.has(userId))
}

export function ChatMessageList({
  messages,
  variant = 'viewer',
  className,
  emptyMessage,
  vipUserIds,
  moderation,
}: ChatMessageListProps) {
  const lastMessageId = messages[messages.length - 1]?.message.id
  const scrollDeps = [messages.length, lastMessageId]

  const content =
    messages.length === 0 ? (
      <ChatEmptyState message={emptyMessage ?? defaultEmptyMessage(variant)} variant={variant} />
    ) : (
      messages.map((event) => (
        <ChatMessageRow
          key={event.message.id}
          event={event}
          variant={variant}
          showTimestamp={variant === 'viewer'}
          isVip={isVipUser(event.message.user?.id, vipUserIds)}
          moderationSlot={
            variant === 'studio' && moderation ? (
              <InlineModerationActions
                userId={event.message.user?.id ?? undefined}
                messageId={event.message.id}
                onUserAction={moderation.onUserAction}
                onDeleteMessage={moderation.onDeleteMessage}
                onPinMessage={moderation.onPinMessage}
              />
            ) : undefined
          }
        />
      ))
    )

  if (variant === 'viewer') {
    return (
      <Card className="flex-1 min-h-0 overflow-hidden shadow-sm">
        <CardContent className="flex flex-col min-h-0 h-full p-0">
          <ChatScrollArea
            scrollDeps={scrollDeps}
            className={cn('flex-1 overflow-y-auto px-3 py-3 space-y-1.5', className)}
          >
            {content}
          </ChatScrollArea>
        </CardContent>
      </Card>
    )
  }

  return (
    <ChatScrollArea
      scrollDeps={scrollDeps}
      className={cn('flex-1 overflow-y-auto p-3 space-y-1', className)}
    >
      {content}
    </ChatScrollArea>
  )
}
