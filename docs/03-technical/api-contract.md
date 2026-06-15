# API Documentation — Endpoints, Request/Response Shapes, Auth

Base path: `/api`

Auth: session cookie or bearer token. Admin endpoints require ADMIN role.

## Auth

### POST /auth/signup

```ts
Request { email: string; username: string; password: string; role?: 'VIEWER' | 'CREATOR' }
Response { user: PublicUser }
```

### POST /auth/login

```ts
Request { email: string; password: string }
Response { user: PublicUser }
```

### POST /auth/logout

```ts
Response { ok: true }
```

### GET /me

```ts
Response { user: PublicUser; wallet?: WalletSummary; creatorProfile?: CreatorProfileSummary }
```

## Rooms

### GET /rooms

```ts
Query { status?: 'LIVE' | 'ENDED'; limit?: number; cursor?: string }
Response { rooms: RoomCard[]; nextCursor?: string }
```

### POST /creator/rooms/prepare

Creates or updates draft room setup.

```ts
Request {
  title: string
  visibility: 'PUBLIC' | 'UNLISTED'
  thumbnailMediaId: string
  privateRateTokensPerMinute: number
  minPrivateMinutes: number
  privateRules: string
}
Response { room: RoomDetail; goLiveEligibility: GoLiveEligibility }
```

### POST /creator/rooms/:roomId/go-live

```ts
Response { room: RoomDetail; livekitToken: string; livekitUrl: string }
```

### POST /creator/rooms/:roomId/end

```ts
Response { room: RoomDetail }
```

### GET /rooms/:slug

```ts
Response { room: RoomDetail; livekitToken?: string; viewerState: ViewerRoomState }
```

## LiveKit

### POST /livekit/token

```ts
Request { appRoomType: 'PUBLIC_ROOM' | 'PRIVATE_SESSION'; appRoomId: string }
Response { livekitUrl: string; token: string; roomName: string }
```

## Chat

### GET /rooms/:roomId/messages

```ts
Response { messages: ChatMessageDto[] }
```

Socket events are described in `shared-types.ts`.

## Tips

### GET /rooms/:roomId/menu

```ts
Response { items: RoomMenuItemDto[]; goal?: RoomGoalDto }
```

### POST /rooms/:roomId/tips

```ts
Request {
  amountTokens: number
  requestType: 'GENERAL' | 'MENU_ITEM' | 'CUSTOM' | 'GOAL'
  menuItemId?: string
  requestText?: string
}
Response { tip: TipDto; wallet: WalletSummary }
```

### POST /creator/tips/:tipId/acknowledge

```ts
Response { tip: TipDto }
```

### POST /creator/tips/:tipId/complete

```ts
Response { tip: TipDto }
```

## Token packs and wallet

### GET /token-packs

```ts
Response { tokenPacks: TokenPackDto[] }
```

### POST /payments/ccbill/checkout

```ts
Request { tokenPackId: string }
Response { paymentTransactionId: string; checkoutUrl: string }
```

### POST /webhooks/ccbill

Provider callback endpoint. Must verify signature/secret according to CCBill integration.

```ts
Response { ok: true }
```

### GET /wallet

```ts
Response { wallet: WalletSummary; ledger: LedgerEntryDto[] }
```

## Private sessions

### POST /rooms/:roomId/private-sessions/request

```ts
Request { requestedMinutes?: number; note?: string }
Response { privateSession: PrivateSessionDto; wallet: WalletSummary }
```

### POST /creator/private-sessions/:id/accept

```ts
Response { privateSession: PrivateSessionDto }
```

### POST /creator/private-sessions/:id/decline

```ts
Request { reason?: string }
Response { privateSession: PrivateSessionDto }
```

### POST /private-sessions/:id/start

```ts
Response { privateSession: PrivateSessionDto; livekitToken: string; livekitUrl: string }
```

### POST /private-sessions/:id/end

```ts
Response { privateSession: PrivateSessionDto; wallet?: WalletSummary }
```

## Media

### POST /media/upload

Multipart upload for avatar/logo/cover.

```ts
Response { media: MediaAssetDto }
```

### POST /rooms/:roomId/thumbnail/capture

Receives browser-captured image frame.

```ts
Request multipart/form-data { image: File }
Response { media: MediaAssetDto; room: RoomDetail }
```

## Admin

### GET /admin/overview

```ts
Response { metrics: AdminOverviewMetrics; queues: AdminQueues }
```

### GET /admin/rooms
### GET /admin/rooms/:id
### POST /admin/rooms/:id/end
### POST /admin/rooms/:id/hide

### GET /admin/users
### GET /admin/users/:id
### POST /admin/users/:id/suspend

### GET /admin/creators
### POST /admin/creators/:id/approve
### POST /admin/creators/:id/suspend

### GET /admin/payments
### GET /admin/payments/:id

### GET /admin/wallets/:userId
### POST /admin/wallets/:userId/adjust

```ts
Request { amountTokens: number; reason: string; adjustmentType: string }
Response { wallet: WalletSummary; ledgerEntry: LedgerEntryDto }
```
