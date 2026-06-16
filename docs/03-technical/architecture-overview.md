# Architecture Overview

## High-level architecture

```txt
Browser Client
  React/Vite or Next frontend
  LiveKit client SDK
  Socket.IO client
        |
        | HTTPS / WebSocket
        v
Railway App
  Node.js + Fastify API
  Socket.IO realtime server
  Auth/session handling
  Wallet/ledger services
  Room/session orchestration
        |
        v
MySQL
  Users
  Rooms
  Wallets
  Ledger
  Payments
  Chat
  Admin actions
        |
        v
Third-party services
  LiveKit Cloud: video rooms, camera/mic/screen share
  CCBill: token-pack checkout and payment callbacks
  Object storage: thumbnails/avatar/logo/media
```

## Architectural principles

- LiveKit handles media; StreamYolo handles product state.
- Socket.IO handles realtime app events; MySQL remains source of truth.
- CCBill handles dollars; StreamYolo handles tokens.
- Wallet ledger is append-only and auditable.
- Video is ephemeral in MVP; operational metadata is retained.
- Manual creator thumbnails, no auto snapshots in MVP.
- Admin can intervene in all live/money-related states.

## Service boundaries

### API service

- REST endpoints for auth, rooms, wallet, token packs, payments, admin, media.
- Issues LiveKit access tokens.
- Creates and updates room/session state.
- Processes CCBill webhooks.

### Realtime service

- Socket.IO namespaces/channels for room events, private session events, user wallet events, creator queue events.
- Delivers chat, tip events, viewer counts, private requests.
- Does not store primary state alone.

### Video provider

- Initial implementation: LiveKit Cloud.
- Abstraction: `VideoProvider` with create room, issue participant token, end room.
- Future: self-hosted LiveKit or alternative provider if needed.

### Payment provider

- Initial implementation: CCBill.
- Abstraction: `PaymentProvider` for checkout creation, webhook verification, transaction status.

## Critical flows

- Go live: Creator setup complete → Room created → LiveKit room token → Socket room online.
- Tip: Viewer action → Wallet debit/credit → Ledger entries → Chat event.
- Private Session: Request → Verify balance → Hold tokens → Create isolated LiveKit media space → Meter capture/release.
- Payment: CCBill checkout → webhook → idempotent credit → ledger.

## Data retention

- Retain users, rooms, chat, tips, ledger, payments, admin actions.
- Do not retain video or raw streams in MVP.
- Media retained: avatar/logo, uploaded room cover, creator-selected thumbnails.
