import type { ChatMessageDto } from './types'

function byCreatedAt(a: ChatMessageDto, b: ChatMessageDto) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
}

export function mergeMessages(existing: ChatMessageDto[], incoming: ChatMessageDto[]): ChatMessageDto[] {
  const map = new Map<string, ChatMessageDto>()
  for (const message of existing) map.set(message.id, message)
  for (const message of incoming) {
    const prior = map.get(message.id)
    map.set(message.id, prior ? { ...prior, ...message } : message)
  }
  return Array.from(map.values()).sort(byCreatedAt)
}

export function upsertMessage(messages: ChatMessageDto[], message: ChatMessageDto): ChatMessageDto[] {
  const index = messages.findIndex((entry) => entry.id === message.id)
  if (index === -1) return [...messages, message].sort(byCreatedAt)
  const next = [...messages]
  next[index] = { ...next[index], ...message }
  return next.sort(byCreatedAt)
}
