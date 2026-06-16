import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NewMessagesPill({
  onClick,
  className,
}: {
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 rounded-full border border-border bg-card/95 px-3 py-1.5',
        'text-xs font-medium text-foreground shadow-md backdrop-blur-sm',
        'transition-all hover:bg-accent hover:scale-[1.02] active:scale-[0.98]',
        className,
      )}
    >
      New messages
      <ChevronDown className="h-3.5 w-3.5" />
    </button>
  )
}
