import type { ChatMessageDto } from './types'

export function userLabel(user: ChatMessageDto['user']) {
  return user?.displayName ?? user?.id ?? 'Viewer'
}

export function displayName(event: { message: ChatMessageDto }) {
  return event.message.user?.displayName ?? 'System'
}
