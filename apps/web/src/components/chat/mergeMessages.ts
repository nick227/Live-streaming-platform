import type { ChatMessageDto, RoomEvent } from './types'

function byCreatedAt(a: RoomEvent, b: RoomEvent) {
  return new Date(a.message.createdAt).getTime() - new Date(b.message.createdAt).getTime()
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
      // Merge message object
      map.set(event.message.id, { ...prior, message: { ...prior.message, ...event.message } } as RoomEvent)
    } else {
      map.set(event.message.id, event)
    }
  }
  return Array.from(map.values()).sort(byCreatedAt)
}

export function upsertMessage(events: RoomEvent[], event: RoomEvent): RoomEvent[] {
  const index = events.findIndex((entry) => entry.message.id === event.message.id)
  if (index === -1) return [...events, event].sort(byCreatedAt)
  const next = [...events]
  next[index] = { ...next[index], message: { ...next[index].message, ...event.message } } as RoomEvent
  return next.sort(byCreatedAt)
}
