import { MessageCircleOff } from 'lucide-react'

export function ChatAccessBanner({ canChat }: { canChat: boolean }) {
  if (canChat) return null

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground shrink-0">
      <MessageCircleOff className="h-3.5 w-3.5 shrink-0" />
      <span>Chat is read-only in this room</span>
    </div>
  )
}
