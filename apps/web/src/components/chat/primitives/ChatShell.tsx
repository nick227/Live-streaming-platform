import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChatConnectionStatus } from './ChatConnectionStatus'

export function ChatShell({
  className,
  connected,
  headerSlot,
  bannerSlot,
  children,
  footer,
}: {
  className?: string
  title?: string
  connected?: boolean
  headerSlot?: ReactNode
  bannerSlot?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 min-h-0 h-full rounded-xl border border-border/60 bg-card/30 p-2',
        className,
      )}
    >
      {headerSlot ?? (
        <div className="flex items-center justify-between shrink-0 px-1">
          {connected !== undefined && <ChatConnectionStatus connected={connected} />}
        </div>
      )}
      {bannerSlot}
      <div className="flex flex-col min-h-0 flex-1">{children}</div>
      {footer}
    </div>
  )
}
