import { Pin } from 'lucide-react'
import { userLabel } from '../model/display'
import type { ChatMessageDto } from '../model/types'

export function PinnedMessageBanner({
  message,
  variant = 'viewer',
}: {
  message: ChatMessageDto
  variant?: 'viewer' | 'studio'
}) {
  if (message.deletedAt) return null

  if (variant === 'studio') {
    return (
      <div className="border-b border-primary/20 bg-primary/8 px-3 py-2 shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
          <Pin className="h-3 w-3" /> Pinned
        </div>
        <p className="text-sm break-words">
          <span className="font-semibold">{userLabel(message.user)}:</span>{' '}
          {message.body}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
      <span className="font-medium text-primary">Pinned: </span>
      <span className="break-words">{message.body}</span>
    </div>
  )
}
