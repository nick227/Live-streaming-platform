// Shared TypeScript types — kept minimal. Canonical contract is in openapi.yaml.
// These are re-exports of the doc/03-technical/shared-types.ts definitions
// adapted for the monorepo. The SDK generated types are the primary source for API shapes.

export type UserRole = 'VIEWER' | 'CREATOR' | 'ADMIN' | 'MODERATOR'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED'
export type CreatorStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'PAUSED' | 'SUSPENDED' | 'BANNED'
export type RoomStatus = 'DRAFT' | 'LIVE' | 'ENDED' | 'SUSPENDED' | 'HIDDEN'
export type RoomVisibility = 'PUBLIC' | 'UNLISTED'
export type PaymentProvider = 'CCBILL'
export type PaymentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CHARGEBACK'
  | 'MANUAL_REVIEW'
export type LedgerEntryType =
  | 'TOKEN_PURCHASE'
  | 'TIP_SENT'
  | 'TIP_RECEIVED'
  | 'PRIVATE_SESSION_HOLD'
  | 'PRIVATE_SESSION_CAPTURE'
  | 'PRIVATE_SESSION_RELEASE'
  | 'REFUND_REVERSAL'
  | 'CHARGEBACK_REVERSAL'
  | 'ADMIN_ADJUSTMENT'
export type ChatMessageType =
  | 'USER_MESSAGE'
  | 'CREATOR_MESSAGE'
  | 'SYSTEM_MESSAGE'
  | 'AUTO_MESSAGE'
  | 'TIP_EVENT'
  | 'MENU_EVENT'
  | 'GOAL_EVENT'
  | 'PRIVATE_REQUEST'
  | 'MODERATION_EVENT'
export type TipRequestType = 'GENERAL' | 'MENU_ITEM' | 'CUSTOM' | 'GOAL'
export type TipStatus = 'SENT' | 'ACKNOWLEDGED' | 'COMPLETED' | 'DECLINED' | 'REVERSED'
export type PrivateSessionStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'ACTIVE'
  | 'ENDED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FORCE_ENDED'
export type ModerationActionType =
  | 'MUTE'
  | 'UNMUTE'
  | 'KICK'
  | 'BAN'
  | 'UNBAN'
  | 'DELETE_MESSAGE'
  | 'PIN_MESSAGE'
  | 'CLEAR_CHAT'
  | 'SLOW_MODE'
  | 'REWARD'
export type CreatorRewardType = 'SHOUTOUT' | 'VIP' | 'UNVIP'

// Socket.IO event types — shared between server and web app
export interface ServerToClientEvents {
  'room:viewer_count': (payload: { roomId: string; viewerCount: number }) => void
  'chat:message': (payload: { message: ChatMessageDto }) => void
  'tip:created': (payload: { tip: TipDto; message: ChatMessageDto }) => void
  'tip:updated': (payload: { tip: TipDto }) => void
  'goal:updated': (payload: { roomId: string; goal: RoomGoalDto }) => void
  'private:request_created': (payload: { privateSession: PrivateSessionDto }) => void
  'private:request_accepted': (payload: { privateSession: PrivateSessionDto }) => void
  'private:request_declined': (payload: { privateSession: PrivateSessionDto }) => void
  'private:session_started': (payload: { privateSession: PrivateSessionDto }) => void
  'private:session_ended': (payload: { privateSession: PrivateSessionDto }) => void
  'wallet:update': (payload: { wallet: WalletSummary }) => void
  'room:ended': (payload: { roomId: string; reason?: string }) => void
  'room:user_muted': (payload: { action: ModerationActionDto }) => void
  'room:user_unmuted': (payload: { action: ModerationActionDto }) => void
  'room:user_kicked': (payload: { action: ModerationActionDto }) => void
  'room:user_banned': (payload: { ban: CreatorUserBanDto; action: ModerationActionDto }) => void
  'room:user_unbanned': (payload: { action: ModerationActionDto }) => void
  'room:user_rewarded': (payload: { reward: CreatorUserRewardDto; action: ModerationActionDto }) => void
  'room:message_deleted': (payload: { message: ChatMessageDto; action: ModerationActionDto }) => void
  'room:message_pinned': (payload: { settings: RoomChatSettingsDto; action: ModerationActionDto }) => void
  'room:chat_settings_updated': (payload: { settings: RoomChatSettingsDto; action: ModerationActionDto }) => void
  'room:removed': (payload: { roomId: string; reason?: string }) => void
}

export interface ClientToServerEvents {
  'room:join': (
    payload: { roomId: string },
    ack?: (result: { ok: boolean; error?: string }) => void,
  ) => void
  'room:leave': (payload: { roomId: string }) => void
  'chat:send': (
    payload: { roomId: string; body: string },
    ack?: (result: { ok: boolean; message?: ChatMessageDto; error?: string }) => void,
  ) => void
  'typing:start': (payload: { roomId: string }) => void
  'typing:stop': (payload: { roomId: string }) => void
}

// DTO shapes used by Socket.IO events (REST shapes come from generated SDK types)
export interface WalletSummary {
  tokenBalance: number
  reservedTokenBalance: number
  lifetimePurchasedTokens: number
  lifetimeSpentTokens: number
}

export interface RoomGoalDto {
  id: string
  title: string
  targetTokens: number
  currentTokens: number
}

export interface ChatMessageDto {
  id: string
  roomId: string
  user?: { id: string; displayName: string }
  type: ChatMessageType
  body: string
  metadata?: Record<string, unknown>
  createdAt: string
  deletedAt?: string
}

export interface TipDto {
  id: string
  roomId: string
  fromUserId: string
  toCreatorId: string
  amountTokens: number
  requestType: TipRequestType
  menuItemId?: string
  requestText?: string
  status: TipStatus
  createdAt: string
}

export interface PrivateSessionDto {
  id: string
  creatorId: string
  viewerId: string
  publicRoomId: string
  status: PrivateSessionStatus
  rateTokensPerMinute: number
  minMinutes: number
  viewerCamRequired: boolean
  screenShareAllowed: boolean
  rulesText?: string
  reservedTokens: number
  capturedTokens: number
  releasedTokens: number
  requestedAt: string
  acceptedAt?: string
  startedAt?: string
  endedAt?: string
}

export interface ModerationActionDto {
  id: string
  roomId: string
  creatorId: string
  actorUserId: string
  targetUserId?: string
  targetMessageId?: string
  type: ModerationActionType
  reason?: string
  durationSeconds?: number
  expiresAt?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface CreatorUserBanDto {
  id: string
  creatorId: string
  userId: string
  createdById: string
  reason?: string
  expiresAt?: string
  createdAt: string
}

export interface CreatorUserRewardDto {
  id: string
  creatorId: string
  userId: string
  createdById: string
  type: CreatorRewardType
  note?: string
  expiresAt?: string
  createdAt: string
}

export interface RoomChatSettingsDto {
  roomId: string
  slowModeSeconds: number
  pinnedMessage?: ChatMessageDto
}

// VideoProvider abstraction — swappable (LiveKit Cloud default)
export interface VideoProvider {
  createRoom(input: {
    roomName: string
    metadata?: Record<string, unknown>
  }): Promise<{ roomName: string }>
  createParticipantToken(input: {
    roomName: string
    userId: string
    role: UserRole
    canPublish: boolean
    canSubscribe: boolean
  }): Promise<{ token: string; url: string }>
  endRoom(input: { roomName: string }): Promise<void>
}

// PaymentProvider abstraction — swappable (CCBill default)
export interface PaymentProviderContract {
  createTokenPackCheckout(input: {
    userId: string
    tokenPackId: string
    paymentTransactionId: string
  }): Promise<{ checkoutUrl: string; providerReference?: string }>
  verifyWebhook(input: {
    headers: Record<string, string>
    body: unknown
  }): Promise<{ valid: boolean; event: PaymentProviderEvent }>
}

export interface PaymentProviderEvent {
  provider: PaymentProvider
  providerTxnId: string
  status: PaymentStatus
  amountCents: number
  currency: 'USD'
  raw: unknown
}
