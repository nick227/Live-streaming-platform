import { useEffect, useRef } from 'react'

export function useChatScroll(scrollDeps: unknown[]) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isNearBottom = useRef(true)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => {
      isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, scrollDeps)

  return { scrollRef, bottomRef }
}
