import type { RoomEvent } from './types'

export type EventFilter = 'ALL' | 'CHAT' | 'TIPS' | 'PRIVATE' | 'MODERATION' | 'SYSTEM'

export function getEventFilter(event: RoomEvent): EventFilter {
  if (event.type === 'tip') return 'TIPS'
  if (event.type === 'moderation') return 'MODERATION'
  if (event.type === 'system') {
    if (event.message.type === 'PRIVATE_REQUEST') return 'PRIVATE'
    return 'SYSTEM'
  }
  return 'CHAT'
}

export const EVENT_FILTERS: EventFilter[] = ['ALL', 'CHAT', 'TIPS', 'PRIVATE', 'MODERATION', 'SYSTEM']
