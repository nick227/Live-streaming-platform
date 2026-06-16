import type { RoomEvent } from './types'

export type EventFilter = 'CHAT' | 'TIPS'

export function getEventFilter(event: RoomEvent): EventFilter {
  if (event.type === 'tip') return 'TIPS'
  // Chat tab includes normal chat plus moderation/system notices.
  return 'CHAT'
}

export const EVENT_FILTERS: EventFilter[] = ['CHAT', 'TIPS']
