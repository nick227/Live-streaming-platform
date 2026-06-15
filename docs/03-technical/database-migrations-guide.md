# Database Schema & Migrations Guide

## ORM

Use Prisma with MySQL.

## Migration principles

- Use `prisma migrate dev` locally.
- Use `prisma migrate deploy` in production.
- Do not use `db push` for production once migrations exist.
- Keep money-adjacent changes explicit and reviewed.
- Add indexes for room status, creator status, payment status, and ledger user/date filters.

## Initial migration groups

### 001_auth_users

- User
- Auth/session support tables, depending on auth strategy

### 002_creators_rooms

- CreatorProfile
- Room
- RoomParticipant
- MediaAsset

### 003_wallet_ledger

- Wallet
- LedgerEntry
- TokenPack

### 004_payments

- PaymentTransaction
- Provider webhook event table if desired

### 005_chat_engagement

- ChatMessage
- CreatorMenuItem
- RoomMenuItem
- RoomGoal
- RoomAutoMessage
- Tip

### 006_private_sessions

- PrivateSession
- PrivateSessionEvent if desired

### 007_admin_moderation

- AdminAction
- Report
- ModerationAction

## Important constraints

- User.email unique.
- User.username unique.
- CreatorProfile.userId unique.
- Wallet.userId unique.
- Room.slug unique or unique among active rooms.
- PaymentTransaction.providerTxnId unique when present.
- LedgerEntry immutable after insert.
- Room must have `currentThumbnailMediaId` before LIVE.

## Ledger transaction rules

Any token mutation must happen inside a database transaction:

1. Lock wallet row.
2. Validate balance/reserved balance.
3. Insert ledger entry.
4. Update wallet balance/reserved balance.
5. Insert related domain record or update status.
6. Emit realtime event after successful commit.

## Webhook idempotency

Store provider event IDs or derive idempotency key from provider transaction reference. Duplicate webhooks must not double-credit tokens.

## Rollback notes

Avoid destructive migrations during POC unless data is disposable. For production-like environments, add columns as nullable, backfill, then enforce constraints.
