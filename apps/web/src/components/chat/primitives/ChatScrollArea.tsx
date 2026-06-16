import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useChatScroll } from '../hooks/useChatScroll'
import { NewMessagesPill } from './NewMessagesPill'

export function ChatScrollArea({
  scrollDeps,
  className,
  children,
}: {
  scrollDeps: unknown[]
  className?: string
  children: ReactNode
}) {
  const { scrollRef, bottomRef, showNewMessages, scrollToBottom } = useChatScroll(scrollDeps)

  return (
    <div className="relative flex flex-col min-h-0 flex-1">
      <div
        ref={scrollRef}
        className={cn('min-h-0', className)}
        aria-live="polite"
        aria-relevant="additions"
      >
        {children}
        <div ref={bottomRef} />
      </div>
      {showNewMessages && (
        <NewMessagesPill
          onClick={scrollToBottom}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10"
        />
      )}
    </div>
  )
}
