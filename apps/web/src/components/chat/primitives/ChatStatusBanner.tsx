import { Clock } from 'lucide-react'

export function ChatStatusBanner({ slowModeSeconds }: { slowModeSeconds: number }) {
  if (slowModeSeconds <= 0) return null

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-900 dark:text-amber-200 shrink-0">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      <span>
        Slow mode active · wait <strong>{slowModeSeconds}s</strong> between messages
      </span>
    </div>
  )
}
