import { Button } from '@/components/ui/Button'
import type { ModerationHandlers } from './types'

function confirmAction(label: string, action: () => void) {
  if (window.confirm(`Confirm: ${label}?`)) action()
}

export function ModerationActionBar({
  userId,
  messageId,
  onUserAction,
  onDeleteMessage,
  onPinMessage,
}: {
  userId?: string
  messageId?: string
} & ModerationHandlers) {
  return (
    <div className="flex flex-wrap gap-1">
      {userId && (
        <>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onUserAction('mute', userId)}>
            Mute
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onUserAction('unmute', userId)}>
            Unmute
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => confirmAction('kick this viewer', () => onUserAction('kick', userId))}>
            Kick
          </Button>
          <Button type="button" size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => confirmAction('ban this viewer', () => onUserAction('ban', userId))}>
            Ban
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onUserAction('vip', userId)}>
            VIP
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onUserAction('unvip', userId)}>
            UnVIP
          </Button>
        </>
      )}
      {messageId && onDeleteMessage && (
        <Button type="button" size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => onDeleteMessage(messageId)}>
          Del
        </Button>
      )}
      {messageId && onPinMessage && (
        <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onPinMessage(messageId)}>
          Pin
        </Button>
      )}
    </div>
  )
}
