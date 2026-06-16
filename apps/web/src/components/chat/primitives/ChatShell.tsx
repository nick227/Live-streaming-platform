import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChatConnectionStatus } from './ChatConnectionStatus'

export function ChatShell({
  className,
  title = 'Chat',
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
    <div className={cn('flex flex-col gap-2 min-h-0 h-full', className)}>
      {headerSlot ?? (
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</h2>
          {connected !== undefined && <ChatConnectionStatus connected={connected} />}
        </div>
      )}
      {bannerSlot}
      {children}
      {footer}
    </div>
  )
}
