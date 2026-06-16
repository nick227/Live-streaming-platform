import { useCallback, useState } from 'react'

const DEFAULT_PAGE_SIZE = 200

export function useMessageWindow<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [limit, setLimit] = useState(pageSize)

  const visible = items.length > limit ? items.slice(-limit) : items
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
