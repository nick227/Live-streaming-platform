import { useCallback, useState } from 'react'

const DEFAULT_PAGE_SIZE = 250
const MAX_RENDERED_MESSAGES = 600

export function useMessageWindow<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [limit, setLimit] = useState(pageSize)

  const cappedLimit = Math.min(limit, MAX_RENDERED_MESSAGES)
  const visible = items.length > cappedLimit ? items.slice(-cappedLimit) : items
  const hiddenCount = items.length - visible.length

  const loadEarlier = useCallback(() => {
    setLimit((current) => current + pageSize)
  }, [pageSize])

  return {
    visible,
    hiddenCount,
    hasHidden: hiddenCount > 0,
    loadEarlier,
  }
}
