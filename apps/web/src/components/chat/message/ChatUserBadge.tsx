import { cn } from '@/lib/utils'

const BADGE_STYLES = {
  vip: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30',
  host: 'bg-primary/10 text-primary ring-1 ring-primary/20',
  mod: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500/25',
} as const

const BADGE_LABELS = {
  vip: 'VIP',
  host: 'Host',
  mod: 'Mod',
} as const

export function ChatUserBadge({ kind }: { kind: keyof typeof BADGE_STYLES }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded px-1 py-px text-[9px] font-bold uppercase tracking-wide leading-none',
        BADGE_STYLES[kind],
      )}
    >
      {BADGE_LABELS[kind]}
    </span>
  )
}
