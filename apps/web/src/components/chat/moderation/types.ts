export type UserAction = 'mute' | 'unmute' | 'kick' | 'ban' | 'shoutout' | 'vip' | 'unvip'

export type ModerationHandlers = {
  onUserAction: (action: UserAction, userId: string) => void
  onDeleteMessage?: (messageId: string) => void
  onPinMessage?: (messageId: string) => void
}
