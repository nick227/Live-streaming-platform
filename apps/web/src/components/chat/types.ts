import type { components } from '@streamyolo/sdk'

export type ChatMessageDto = components['schemas']['ChatMessageDto']

export type RoomEvent =
  | { type: 'chat'; message: ChatMessageDto }
  | { type: 'tip'; message: ChatMessageDto; amountTokens: number }
  | { type: 'system'; message: ChatMessageDto }
  | { type: 'moderation'; message: ChatMessageDto }
