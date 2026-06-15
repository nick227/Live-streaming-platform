import { cn } from '@/lib/utils'
import type { ChatMessageDto } from './types'

const SYSTEM_TYPES = new Set([
  'SYSTEM_MESSAGE',
  'AUTO_MESSAGE',
  'GOAL_EVENT',
  'MENU_EVENT',
  'MODERATION_EVENT',
])

function displayName(message: ChatMessageDto) {
  return message.user?.displayName ?? 'System'
}

function rowClassName(type: ChatMessageDto['type']) {
  if (type === 'TIP_EVENT') return 'bg-amber-500/10 border-amber-500/30'
  if (type === 'PRIVATE_REQUEST') return 'bg-purple-500/10 border-purple-500/30'
  if (SYSTEM_TYPES.has(type)) return 'bg-muted/40 border-border/50'
  return 'border-transparent'
}

export function ChatMessageRow({ message }: { message: ChatMessageDto }) {
  const removed = Boolean(message.deletedAt)

  return (
    <div
      className={cn(
        'rounded border px-2 py-1.5 text-sm',
        rowClassName(message.type),
        removed && 'opacity-60',
      )}
    >
      <div className="flex items-baseline gap-2 min-w-0">
        <span
          className={cn(
            'font-medium shrink-0',
            message.type === 'TIP_EVENT' ? 'text-amber-600 dark:text-amber-400' : 'text-primary',
          )}
        >
          {displayName(message)}:
        </span>
        <span className={cn('break-words min-w-0', SYSTEM_TYPES.has(message.type) && 'text-muted-foreground italic')}>
          {removed ? 'Message removed' : message.body}
        </span>
      </div>
    </div>
  )
}
