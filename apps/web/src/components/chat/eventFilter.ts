import type { ChatMessageDto } from './types'

export type EventFilter = 'ALL' | 'CHAT' | 'TIPS' | 'PRIVATE' | 'MODERATION' | 'SYSTEM'

export function getEventFilter(message: ChatMessageDto): EventFilter {
  if (message.type === 'TIP_EVENT') return 'TIPS'
  if (message.type === 'PRIVATE_REQUEST') return 'PRIVATE'
  if (message.type === 'MODERATION_EVENT') return 'MODERATION'
  if (
    message.type === 'SYSTEM_MESSAGE'
    || message.type === 'AUTO_MESSAGE'
    || message.type === 'GOAL_EVENT'
    || message.type === 'MENU_EVENT'
  ) {
    return 'SYSTEM'
  }
  return 'CHAT'
}

export const EVENT_FILTERS: EventFilter[] = ['ALL', 'CHAT', 'TIPS', 'PRIVATE', 'MODERATION', 'SYSTEM']
