import type { ChatItem } from './types'

export type ChatFilter = 'CHAT' | 'TIPS'

export function getChatFilter(item: ChatItem): ChatFilter {
  if (item.type === 'tip') return 'TIPS'
  // Chat tab includes normal chat plus moderation/system notices.
  return 'CHAT'
}

export const CHAT_FILTERS: ChatFilter[] = ['CHAT', 'TIPS']
