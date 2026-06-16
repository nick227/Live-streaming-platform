import { cn } from '@/lib/utils'
import { userLabel } from '../model/display'
import type { ChatMessageDto } from '../model/types'
import { ChatUserBadge } from './ChatUserBadge'

export function ChatUsername({
  user,
  messageType,
  isVip = false,
  className,
  nameClassName,
}: {
  user: ChatMessageDto['user']
  messageType?: ChatMessageDto['type']
  isVip?: boolean
  className?: string
  nameClassName?: string
}) {
  const isHost = messageType === 'CREATOR_MESSAGE' || user?.role === 'CREATOR'
  const isMod = user?.role === 'MODERATOR'

  return (
    <span className={cn('inline-flex items-center gap-1 min-w-0 max-w-full', className)}>
      <span className={cn('truncate', nameClassName)}>{user ? userLabel(user) : 'System'}</span>
      {isHost && <ChatUserBadge kind="host" />}
      {isVip && <ChatUserBadge kind="vip" />}
      {isMod && <ChatUserBadge kind="mod" />}
    </span>
  )
}
