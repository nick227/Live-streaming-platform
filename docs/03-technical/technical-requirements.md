# Technical Requirements / Stack Decision Doc

## Functional technical requirements

- Authenticated users can have roles: VIEWER, CREATOR, ADMIN.
- Creators can configure a profile, room thumbnail, private rules/pricing, and tip menu.
- Backend must prevent room start until required setup is complete.
- Backend issues LiveKit tokens with correct participant grants.
- Socket.IO rooms must mirror app room/private session identifiers.
- Chat messages and system events must persist.
- Tips must produce wallet mutations and ledger entries in one transaction.
- Private sessions must reserve, capture, and release tokens safely.
- CCBill webhooks must be idempotent.
- Admin actions must be logged.
- Admins can end rooms/private sessions and suspend users/creators.

## Stack decisions

- Live video: LiveKit Cloud.
- App hosting: Railway.
- API: Fastify.
- Realtime: Socket.IO.
- Database: MySQL.
- ORM: Prisma.
- Payments: CCBill token-pack purchases.
- Video recording: none in MVP.
- Auto stream snapshots: deferred.

## Implementation constraints

- Do not make LiveKit the business event bus.
- Do not charge cards per tip/private minute.
- Do not edit ledger rows after creation.
- Do not store private-session frames as thumbnails.
- Do not expose admin data through public APIs.
- Do not rely on WebSocket-only state for money or room lifecycle.

## Provider abstraction interfaces

- `VideoProvider`
- `PaymentProvider`
- `StorageProvider`
- `NotificationProvider` later

## Required background jobs

MVP can start with synchronous handlers, but should support:

- Payment webhook retry/reconciliation.
- Room cleanup.
- Expired private request cleanup.
- Media cleanup for deleted thumbnails.
- Session timeout cleanup.
