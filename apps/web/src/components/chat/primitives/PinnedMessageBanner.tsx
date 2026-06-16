import { Pin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatUsername } from '../message/ChatUsername'
import type { ChatMessageDto } from '../model/types'

export function PinnedMessageBanner({
  message,
  variant = 'viewer',
  isVip = false,
}: {
  message: ChatMessageDto
  variant?: 'viewer' | 'studio'
  isVip?: boolean
}) {
  if (message.deletedAt) return null

  if (variant === 'studio') {
    return (
      <div className="border-b border-primary/25 bg-gradient-to-r from-primary/10 to-transparent px-3 py-2.5 shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
          <Pin className="h-3 w-3" /> Pinned
        </div>
        <p className="text-sm break-words leading-snug">
          <ChatUsername
            user={message.user}
            messageType={message.type}
            isVip={isVip}
            nameClassName="font-semibold"
          />
          <span className="text-muted-foreground">: </span>
          {message.body}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm shrink-0')}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
        <Pin className="h-3 w-3" />
        Pinned
      </div>
      <p className="break-words leading-snug">{message.body}</p>
    </div>
  )
}
