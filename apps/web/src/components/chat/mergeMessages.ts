import type { ChatMessageDto, RoomEvent } from './types'

function createdAtMs(event: RoomEvent) {
  return Date.parse(event.message.createdAt)
}

function byCreatedAt(a: RoomEvent, b: RoomEvent) {
  return createdAtMs(a) - createdAtMs(b)
}

function mergeEvent(prior: RoomEvent, event: RoomEvent): RoomEvent {
  return { ...prior, ...event, message: { ...prior.message, ...event.message } } as RoomEvent
}

function sortedInsert(events: RoomEvent[], event: RoomEvent) {
  const eventTime = createdAtMs(event)
  const next = [...events]
  let low = 0
  let high = next.length

  while (low < high) {
    const mid = (low + high) >> 1
    if (createdAtMs(next[mid]) <= eventTime) low = mid + 1
    else high = mid
  }

  next.splice(low, 0, event)
  return next
}

export function toRoomEvent(message: ChatMessageDto, amountTokens?: number): RoomEvent {
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

export function mergeMessages(existing: RoomEvent[], incoming: RoomEvent[]): RoomEvent[] {
  const map = new Map<string, RoomEvent>()
  for (const event of existing) map.set(event.message.id, event)
  for (const event of incoming) {
    const prior = map.get(event.message.id)
    if (prior) {
      map.set(event.message.id, mergeEvent(prior, event))
    } else {
      map.set(event.message.id, event)
    }
  }
  return Array.from(map.values()).sort(byCreatedAt)
}

export function upsertMessage(events: RoomEvent[], event: RoomEvent): RoomEvent[] {
  const index = events.findIndex((entry) => entry.message.id === event.message.id)
  if (index === -1) {
    if (events.length === 0 || createdAtMs(events[events.length - 1]) <= createdAtMs(event)) {
      return [...events, event]
    }
    return sortedInsert(events, event)
  }

  const prior = events[index]
  const merged = mergeEvent(prior, event)
  const next = [...events]
  next[index] = merged

  if (prior.message.createdAt === merged.message.createdAt) {
    return next
  }

  next.splice(index, 1)
  return sortedInsert(next, merged)
}
