import { useCallback, useEffect, useRef, useState } from 'react'

export function useChatScroll(scrollDeps: unknown[]) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isNearBottom = useRef(true)
  const [showNewMessages, setShowNewMessages] = useState(false)

  const updateScrollPosition = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    isNearBottom.current = near
    if (near) setShowNewMessages(false)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollPosition, { passive: true })
    return () => el.removeEventListener('scroll', updateScrollPosition)
  }, [updateScrollPosition])

  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setShowNewMessages(false)
      return
    }
    setShowNewMessages(true)
  }, scrollDeps)

  const scrollToBottom = useCallback(() => {
    isNearBottom.current = true
    setShowNewMessages(false)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return { scrollRef, bottomRef, showNewMessages, scrollToBottom }
}
