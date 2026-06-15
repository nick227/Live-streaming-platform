// StreamYolo Shared Types Contract

export type UserRole = 'VIEWER' | 'CREATOR' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED'
export type CreatorStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'PAUSED' | 'SUSPENDED' | 'BANNED'
export type RoomStatus = 'DRAFT' | 'LIVE' | 'ENDED' | 'SUSPENDED' | 'HIDDEN'
export type RoomVisibility = 'PUBLIC' | 'UNLISTED'
export type PaymentProvider = 'CCBILL'
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'FAILED' | 'REFUNDED' | 'CHARGEBACK' | 'MANUAL_REVIEW'
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
export type PrivateSessionStatus = 'REQUESTED' | 'ACCEPTED' | 'DECLINED' | 'ACTIVE' | 'ENDED' | 'CANCELLED' | 'EXPIRED' | 'FORCE_ENDED'

export interface PublicUser {
  id: string
  username: string
  displayName?: string
  role: UserRole
  status: UserStatus
}

export interface WalletSummary {
  tokenBalance: number
  reservedTokenBalance: number
  lifetimePurchasedTokens: number
  lifetimeSpentTokens: number
}

export interface TokenPackDto {
  id: string
  name: string
  priceCents: number
  tokenAmount: number
  bonusTokenAmount: number
  currency: 'USD'
  isActive: boolean
  sortOrder: number
}

export interface RoomCard {
  id: string
  slug: string
  title: string
  status: RoomStatus
  visibility: RoomVisibility
  creator: CreatorSummary
  thumbnailUrl?: string
  viewerCount: number
  privateAvailable: boolean
  privateRateTokensPerMinute?: number
  startedAt?: string
}

export interface CreatorSummary {
  id: string
  username: string
  stageName: string
  avatarUrl?: string
  isLive: boolean
}

export interface RoomMenuItemDto {
  id: string
  label: string
  description?: string
  tokenAmount: number
  sortOrder: number
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
  user?: PublicUser
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
  reservedTokens: number
  capturedTokens: number
  releasedTokens: number
  requestedAt: string
  acceptedAt?: string
  startedAt?: string
  endedAt?: string
}

export interface GoLiveEligibility {
  canGoLive: boolean
  missing: Array<'AVATAR_OR_LOGO' | 'ROOM_THUMBNAIL' | 'ROOM_TITLE' | 'PRIVATE_RULES' | 'PRIVATE_RATE' | 'TIP_MENU'>
}

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
}

export interface ClientToServerEvents {
  'room:join': (payload: { roomId: string }, ack?: (result: { ok: boolean; error?: string }) => void) => void
  'room:leave': (payload: { roomId: string }) => void
  'chat:send': (payload: { roomId: string; body: string }, ack?: (result: { ok: boolean; message?: ChatMessageDto; error?: string }) => void) => void
  'typing:start': (payload: { roomId: string }) => void
  'typing:stop': (payload: { roomId: string }) => void
}

export interface VideoProvider {
  createRoom(input: { roomName: string; metadata?: Record<string, unknown> }): Promise<{ roomName: string }>
  createParticipantToken(input: { roomName: string; userId: string; role: UserRole; canPublish: boolean; canSubscribe: boolean }): Promise<{ token: string; url: string }>
  endRoom(input: { roomName: string }): Promise<void>
}

export interface PaymentProviderContract {
  createTokenPackCheckout(input: { userId: string; tokenPackId: string; paymentTransactionId: string }): Promise<{ checkoutUrl: string; providerReference?: string }>
  verifyWebhook(input: { headers: Record<string, string>; body: unknown }): Promise<{ valid: boolean; event: PaymentProviderEvent }>
}

export interface PaymentProviderEvent {
  provider: PaymentProvider
  providerTxnId: string
  status: PaymentStatus
  amountCents: number
  currency: 'USD'
  raw: unknown
}
