import { useEffect, useRef, useState } from 'react'

export function useHighlightIds(itemIds: string[]) {
  const [highlightIds, setHighlightIds] = useState<Set<string>>(() => new Set())
  const prevCountRef = useRef(itemIds.length)
  const prevLastIdRef = useRef(itemIds[itemIds.length - 1])

  useEffect(() => {
    const lastId = itemIds[itemIds.length - 1]
    const grew = itemIds.length > prevCountRef.current
    const lastChanged = lastId && lastId !== prevLastIdRef.current

    prevCountRef.current = itemIds.length
    prevLastIdRef.current = lastId

    if (!grew || !lastChanged || !lastId) return

    setHighlightIds(new Set([lastId]))
    const timer = window.setTimeout(() => setHighlightIds(new Set()), 1800)
    return () => window.clearTimeout(timer)
  }, [itemIds.length, itemIds[itemIds.length - 1]])

  return highlightIds
}
