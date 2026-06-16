import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useHighlightIds } from '../hooks/useHighlightIds'
import { useMessageWindow } from '../hooks/useMessageWindow'
import { ChatScrollArea } from '../primitives/ChatScrollArea'
import type { ChatItem } from '../model/types'
import { InlineModerationActions } from '../moderation/InlineModerationActions'
import type { ModerationHandlers } from '../moderation/types'
import { ChatEmptyState } from './ChatEmptyState'
import { ChatMessageRow } from './ChatMessageRow'

type ChatMessageListProps = {
  messages: ChatItem[]
  variant?: 'viewer' | 'studio'
  className?: string
  emptyMessage?: string
  vipUserIds?: ReadonlySet<string>
  moderation?: Required<Pick<ModerationHandlers, 'onUserAction' | 'onDeleteMessage' | 'onPinMessage'>>
}

function defaultEmptyMessage(variant: 'viewer' | 'studio') {
  return variant === 'studio' ? 'No chat yet…' : 'No messages yet. Say hello!'
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
  const { visible, hiddenCount, hasHidden, loadEarlier } = useMessageWindow(messages)
  const lastMessageId = visible[visible.length - 1]?.message.id
  const scrollDeps = [visible.length, lastMessageId, hiddenCount]

  const tipIds = visible.filter((event) => event.type === 'tip').map((event) => event.message.id)
  const highlightTipIds = useHighlightIds(tipIds)

  const rows = visible.map((event) => (
    <ChatMessageRow
      key={event.message.id}
      event={event}
      variant={variant}
      showTimestamp={variant === 'viewer'}
      isVip={isVipUser(event.message.user?.id, vipUserIds)}
      isHighlight={event.type === 'tip' && highlightTipIds.has(event.message.id)}
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

  const content =
    messages.length === 0 ? (
      <ChatEmptyState message={emptyMessage ?? defaultEmptyMessage(variant)} variant={variant} />
    ) : (
      <>
        {hasHidden && (
          <div className="flex justify-center pb-2">
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={loadEarlier}>
              Load earlier ({hiddenCount})
            </Button>
          </div>
        )}
        {rows}
      </>
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
