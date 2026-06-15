# Data Model / Schema Outline

## Core models

### User

```ts
User {
  id: string
  email: string
  username: string
  displayName?: string
  role: 'VIEWER' | 'CREATOR' | 'ADMIN'
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
  ageVerifiedAt?: Date
  emailVerifiedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### CreatorProfile

```ts
CreatorProfile {
  id: string
  userId: string
  stageName: string
  bio?: string
  avatarMediaId?: string
  bannerMediaId?: string
  status: 'DRAFT' | 'PENDING' | 'ACTIVE' | 'PAUSED' | 'SUSPENDED' | 'BANNED'
  isLive: boolean
  currentRoomId?: string
  privateRateTokensPerMinute: number
  minPrivateMinutes: number
  privateRules: string
  payoutStatus: 'DISABLED' | 'MANUAL_REVIEW' | 'ELIGIBLE'
  pendingTokenBalance: number
  createdAt: Date
  updatedAt: Date
}
```

### Room

```ts
Room {
  id: string
  creatorId: string
  title: string
  slug: string
  status: 'DRAFT' | 'LIVE' | 'ENDED' | 'SUSPENDED' | 'HIDDEN'
  visibility: 'PUBLIC' | 'UNLISTED'
  livekitRoomName: string
  currentThumbnailMediaId: string
  roomGoalId?: string
  startedAt?: Date
  endedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### Wallet

```ts
Wallet {
  id: string
  userId: string
  tokenBalance: number
  reservedTokenBalance: number
  lifetimePurchasedTokens: number
  lifetimeSpentTokens: number
  createdAt: Date
  updatedAt: Date
}
```

### LedgerEntry

```ts
LedgerEntry {
  id: string
  walletId: string
  userId: string
  type: LedgerEntryType
  amountTokens: number
  balanceAfter: number
  roomId?: string
  tipId?: string
  privateSessionId?: string
  paymentTransactionId?: string
  adminActionId?: string
  description?: string
  metadataJson?: unknown
  createdAt: Date
}
```

### TokenPack

```ts
TokenPack {
  id: string
  name: string
  priceCents: number
  tokenAmount: number
  bonusTokenAmount: number
  currency: 'USD'
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}
```

### PaymentTransaction

```ts
PaymentTransaction {
  id: string
  userId: string
  tokenPackId: string
  provider: 'CCBILL'
  providerTxnId?: string
  providerCustomerId?: string
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'FAILED' | 'REFUNDED' | 'CHARGEBACK' | 'MANUAL_REVIEW'
  amountCents: number
  currency: 'USD'
  tokensCredited: number
  checkoutUrl?: string
  rawProviderJson?: unknown
  approvedAt?: Date
  failedAt?: Date
  refundedAt?: Date
  chargebackAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### Tip

```ts
Tip {
  id: string
  roomId: string
  fromUserId: string
  toCreatorId: string
  amountTokens: number
  requestType: 'GENERAL' | 'MENU_ITEM' | 'CUSTOM' | 'GOAL'
  menuItemId?: string
  requestText?: string
  status: 'SENT' | 'ACKNOWLEDGED' | 'COMPLETED' | 'DECLINED' | 'REVERSED'
  createdAt: Date
  updatedAt: Date
}
```

### PrivateSession

```ts
PrivateSession {
  id: string
  creatorId: string
  viewerId: string
  publicRoomId: string
  status: 'REQUESTED' | 'ACCEPTED' | 'DECLINED' | 'ACTIVE' | 'ENDED' | 'CANCELLED' | 'EXPIRED' | 'FORCE_ENDED'
  rateTokensPerMinute: number
  minMinutes: number
  reservedTokens: number
  capturedTokens: number
  releasedTokens: number
  livekitRoomName?: string
  requestedAt: Date
  acceptedAt?: Date
  startedAt?: Date
  endedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### ChatMessage

```ts
ChatMessage {
  id: string
  roomId: string
  userId?: string
  type: 'USER_MESSAGE' | 'CREATOR_MESSAGE' | 'SYSTEM_MESSAGE' | 'AUTO_MESSAGE' | 'TIP_EVENT' | 'MENU_EVENT' | 'GOAL_EVENT' | 'PRIVATE_REQUEST' | 'MODERATION_EVENT'
  body: string
  tipId?: string
  privateSessionId?: string
  metadataJson?: unknown
  createdAt: Date
  deletedAt?: Date
}
```

### CreatorMenuItem / RoomMenuItem

```ts
CreatorMenuItem {
  id: string
  creatorId: string
  label: string
  description?: string
  tokenAmount: number
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

RoomMenuItem {
  id: string
  roomId: string
  sourceCreatorMenuItemId?: string
  label: string
  description?: string
  tokenAmount: number
  isActive: boolean
  sortOrder: number
}
```

### MediaAsset

```ts
MediaAsset {
  id: string
  ownerUserId: string
  creatorId?: string
  roomId?: string
  type: 'AVATAR' | 'LOGO' | 'ROOM_COVER' | 'ROOM_THUMBNAIL_CAPTURE' | 'BANNER'
  url: string
  blurhash?: string
  dominantColor?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED' | 'HIDDEN'
  source: 'UPLOADED' | 'CREATOR_CAPTURED'
  createdAt: Date
  updatedAt: Date
}
```

### AdminAction

```ts
AdminAction {
  id: string
  adminUserId: string
  targetUserId?: string
  targetRoomId?: string
  targetPaymentId?: string
  type: string
  reason?: string
  metadataJson?: unknown
  createdAt: Date
}
```
