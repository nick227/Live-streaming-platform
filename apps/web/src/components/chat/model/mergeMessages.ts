import type { ChatItem, ChatMessageDto } from './types'

function createdAtMs(item: ChatItem) {
  return Date.parse(item.message.createdAt)
}

function byCreatedAt(a: ChatItem, b: ChatItem) {
  return createdAtMs(a) - createdAtMs(b)
}

function mergeEvent(prior: ChatItem, item: ChatItem): ChatItem {
  return { ...prior, ...item, message: { ...prior.message, ...item.message } } as ChatItem
}

function sortedInsert(items: ChatItem[], item: ChatItem) {
  const itemTime = createdAtMs(item)
  const next = [...items]
  let low = 0
  let high = next.length

  while (low < high) {
    const mid = (low + high) >> 1
    if (createdAtMs(next[mid]) <= itemTime) low = mid + 1
    else high = mid
  }

  next.splice(low, 0, item)
  return next
}

export function toChatItem(message: ChatMessageDto, amountTokens?: number): ChatItem {
  if (message.type === 'TIP_EVENT') {
    return { type: 'tip', message, amountTokens: amountTokens ?? 0 }
  }
  if (message.type === 'SYSTEM_MESSAGE' || message.type === 'GOAL_EVENT' || message.type === 'MENU_EVENT' || message.type === 'PRIVATE_REQUEST') {
    return { type: 'system', message }
  }
  if (message.type === 'MODERATION_EVENT') {
    return { type: 'moderation', message }
  }
  return { type: 'chat', message }
}

export function mergeMessages(existing: ChatItem[], incoming: ChatItem[]): ChatItem[] {
  const map = new Map<string, ChatItem>()
  for (const item of existing) map.set(item.message.id, item)
  for (const item of incoming) {
    const prior = map.get(item.message.id)
    if (prior) {
      map.set(item.message.id, mergeEvent(prior, item))
    } else {
      map.set(item.message.id, item)
    }
  }
  return Array.from(map.values()).sort(byCreatedAt)
}

export function upsertMessage(items: ChatItem[], item: ChatItem): ChatItem[] {
  const index = items.findIndex((entry) => entry.message.id === item.message.id)
  if (index === -1) {
    if (items.length === 0 || createdAtMs(items[items.length - 1]) <= createdAtMs(item)) {
      return [...items, item]
    }
    return sortedInsert(items, item)
  }

  const prior = items[index]
  const merged = mergeEvent(prior, item)
  const next = [...items]
  next[index] = merged

  if (prior.message.createdAt === merged.message.createdAt) {
    return next
  }

  next.splice(index, 1)
  return sortedInsert(next, merged)
}
