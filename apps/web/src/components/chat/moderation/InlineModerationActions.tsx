import { Pin } from 'lucide-react'
import type { ModerationHandlers, ModerationUserState } from './types'

function confirmAction(label: string, action: () => void) {
  if (window.confirm(`Confirm: ${label}?`)) action()
}

export function InlineModerationActions({
  userId,
  messageId,
  isMuted = false,
  isVip = false,
  onUserAction,
  onDeleteMessage,
  onPinMessage,
}: {
  userId?: string
  messageId?: string
} & ModerationUserState & ModerationHandlers) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {userId && (
        <>
          <button
            className="h-6 px-1.5 rounded text-[10px] font-medium bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => onUserAction(isMuted ? 'unmute' : 'mute', userId)}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
          <button
            className="h-6 px-1.5 rounded text-[10px] font-medium bg-muted hover:bg-red-600 hover:text-white text-muted-foreground transition-colors"
            onClick={() => confirmAction('kick this viewer', () => onUserAction('kick', userId))}
            title="Kick"
          >
            Kick
          </button>
          <button
            className="h-6 px-1.5 rounded text-[10px] font-medium bg-muted hover:bg-red-700 hover:text-white text-muted-foreground transition-colors"
            onClick={() => confirmAction('ban this viewer', () => onUserAction('ban', userId))}
            title="Ban"
          >
            Ban
          </button>
          <button
            className="h-6 px-1.5 rounded text-[10px] font-medium bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-colors"
            onClick={() => onUserAction(isVip ? 'unvip' : 'vip', userId)}
            title={isVip ? 'Remove VIP' : 'VIP'}
          >
            {isVip ? 'UnVIP' : 'VIP'}
          </button>
        </>
      )}
      {messageId && onDeleteMessage && (
        <button
          className="h-6 px-1.5 rounded text-[10px] font-medium bg-muted hover:bg-red-600 hover:text-white text-muted-foreground transition-colors"
          onClick={() => onDeleteMessage(messageId)}
          title="Delete message"
        >
          Del
        </button>
      )}
      {messageId && onPinMessage && (
        <button
          className="h-6 w-6 rounded flex items-center justify-center bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onPinMessage(messageId)}
          title="Pin message"
        >
          <Pin className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
