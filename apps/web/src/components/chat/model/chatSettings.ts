import type { ChatMessageDto } from './types'

export function extractSlowModeSeconds(messages: ChatMessageDto[]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const metadata = messages[index].metadata as { slowModeSeconds?: number } | null | undefined
    if (metadata?.slowModeSeconds !== undefined) {
      return metadata.slowModeSeconds
    }
  }
  return 0
}

export function readSlowModeFromMessage(message: ChatMessageDto): number | undefined {
  const metadata = message.metadata as { slowModeSeconds?: number } | null | undefined
  return metadata?.slowModeSeconds
}
