import type { ChatMessageDto } from '../model/types'

export type RoomGoal = {
  id: string
  title: string
  targetTokens: number
  currentTokens: number
}

export type PrivateRequestStatus = 'IDLE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'ACTIVE'

export type RoomSocketCallbacks = {
  onTipCreated?: (payload: { tip: { amountTokens: number }; message: ChatMessageDto }) => void
  onUserRewarded?: (payload: { reward: { type: string } }) => void
  onGoalUpdated?: (payload: { roomId: string; goal: RoomGoal }) => void
  onPrivateRequestCreated?: (payload: unknown) => void
  onPrivateRequestStatusChanged?: (payload: { status: 'ACCEPTED' | 'DECLINED'; privateSessionId?: string }) => void
  onRoomEnded?: (payload: { roomId: string; reason?: string }) => void
  onMessagePinned?: (payload: { pinnedMessage?: ChatMessageDto | null }) => void
}

export type RoomChatSettingsPayload = {
  slowModeSeconds: number
  pinnedMessage?: ChatMessageDto | null
}

export type RoomSocketActions = {
  setConnected: (connected: boolean) => void
  setViewerCount: (count: number) => void
  setPinnedMessage: (message: ChatMessageDto | null) => void
  setSlowModeSeconds: (seconds: number) => void
  setPrivateRequestStatus: (status: PrivateRequestStatus) => void
  upsertMessage: (message: ChatMessageDto, amountTokens?: number) => void
  markMessageDeleted: (messageId: string, deletedAt: string) => void
  onUserRewarded: (payload: { reward: { type: string; userId: string } }) => void
  navigate: (path: string) => void
  toastError: (message: string) => void
  getCallbacks: () => RoomSocketCallbacks | undefined
}
