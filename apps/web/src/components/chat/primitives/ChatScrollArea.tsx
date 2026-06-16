import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useChatScroll } from '../hooks/useChatScroll'

export function ChatScrollArea({
  scrollDeps,
  className,
  children,
}: {
  scrollDeps: unknown[]
  className?: string
  children: ReactNode
}) {
  const { scrollRef, bottomRef } = useChatScroll(scrollDeps)

  return (
    <div
      ref={scrollRef}
      className={cn('min-h-0', className)}
      aria-live="polite"
      aria-relevant="additions"
    >
      {children}
      <div ref={bottomRef} />
    </div>
  )
}
