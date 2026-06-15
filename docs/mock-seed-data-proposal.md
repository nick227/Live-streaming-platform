# Mock Seed Data Proposal

## Goal

Build a realistic local dataset that makes StreamYolo feel like a live creator marketplace during development, QA, screenshots, and demos. The seed should cover the happy path and the operational edge cases: live discovery, go-live readiness, wallets, tips, private sessions, payments, media review, and admin moderation.

## Current Seed Review

The current seed is a useful smoke-test baseline, but it is too narrow for app review:

- It creates one admin, one creator, one viewer, token packs, one creator menu, and one draft room.
- It does not create any live public rooms, so the default room browse page can still look empty.
- It does not seed media assets, room goals, room menu snapshots, chat messages, tips, payment transactions, private sessions, reports, or admin actions.
- It does not cover creator approval states such as `DRAFT`, `PENDING`, `PAUSED`, `SUSPENDED`, or `BANNED`.
- It does not cover wallet histories, reserved balances, failed payments, refunds, chargebacks, or moderation queues.

Before expanding it, fix the current seed to match the Prisma schema:

- `CreatorMenuItem` uses `creatorId`, not `creatorProfileId`.
- `Room` requires `livekitRoomName`.
- `Room` does not currently have `privateRateTokensPerMinute`, `minPrivateMinutes`, `privateViewerCamRequired`, or `privateScreenShareAllowed`; those values live on `CreatorProfile` and are copied to `PrivateSession`.
- If mock thumbnails should render in the web app, room API responses need media URLs, not only `thumbnailMediaId`.

## Seed Personas

Use stable email/password logins for manual QA. All dev accounts can use `password123`.

| Persona | Email | Role | Purpose |
| --- | --- | --- | --- |
| Admin | `admin@dev.local` | ADMIN | Admin dashboards, moderation, wallet adjustments |
| Active creator | `creator.live@dev.local` | CREATOR | Fully eligible creator with active live room |
| Pending creator | `creator.pending@dev.local` | CREATOR | Admin approval queue and go-live rejection |
| Incomplete creator | `creator.draft@dev.local` | CREATOR | Missing thumbnail/menu/private rules scenarios |
| Suspended creator | `creator.suspended@dev.local` | CREATOR | Admin enforcement and hidden room states |
| Funded viewer | `viewer.funded@dev.local` | VIEWER | Tips, token purchase history, private request |
| Low-balance viewer | `viewer.low@dev.local` | VIEWER | Insufficient token paths |
| Reserved-balance viewer | `viewer.private@dev.local` | VIEWER | Active/requested private-session holds |
| Report-heavy viewer | `viewer.reporter@dev.local` | VIEWER | Report flows and admin review |

## Data Shape

### Token Packs

Keep the existing four packs, plus one inactive historical pack:

- `100 Tokens`, `500 Tokens + 50 bonus`, `1000 Tokens + 150 bonus`, `5000 Tokens + 1000 bonus`.
- `Legacy 250 Tokens`, inactive, to verify admin/payment views do not assume all packs are purchasable.

### Creators

Seed five creator profiles:

- `Luna Signal`: `ACTIVE`, live, complete media, private rules, and menu items.
- `Nova Room`: `ACTIVE`, offline but eligible, with a prepared draft room.
- `Mira Pending`: `PENDING`, complete profile but blocked from go-live by admin approval.
- `Echo Draft`: `DRAFT`, missing thumbnail and tip menu to exercise eligibility errors.
- `Vera Paused`: `SUSPENDED` or `PAUSED`, with prior rooms and admin actions.

Each creator should have realistic `bio`, `privateRateTokensPerMinute`, `minPrivateMinutes`, viewer-camera and screen-share settings, and `privateRulesText`.

### Media Assets

Seed approved assets for the active creators:

- Avatar, banner, room cover, and room thumbnail capture.
- Use stable local placeholder URLs under `STORAGE_BASE_URL`, such as `/uploads/dev/luna-thumb.webp`.

Seed moderation examples:

- One `PENDING` room cover for admin review.
- One `REJECTED` avatar with an admin action.
- One `HIDDEN` or `REMOVED` asset attached to a report.

### Rooms

Create a browseable room grid:

- 3 `LIVE` public rooms with thumbnails, goals, viewer counts, room menu snapshots, and chat.
- 1 `UNLISTED` live room to verify it is excluded from public discovery.
- 2 `DRAFT` rooms to support creator setup and go-live eligibility testing.
- 2 `ENDED` rooms with historical tips and messages for admin/history views.
- 1 `HIDDEN` or `SUSPENDED` room attached to a moderation action.

For every seeded room, set `livekitRoomName` to a stable unique value such as `dev-room-luna-live`.

### Room Goals

Add goals to live rooms:

- A nearly complete goal, for example `Studio lights` at `1800 / 2000`.
- A fresh goal at `0 / 1000`.
- A completed-over-target goal at `2200 / 2000` to verify display behavior.

### Tip Menus

Seed creator-level menus and per-room snapshots:

- 4-6 active creator menu items per active creator.
- 1 inactive creator item to verify filtering.
- Matching `RoomMenuItem` snapshots for live rooms so the room menu has stable historical labels and prices even if creator menus change.

### Chat Messages

For each live room, seed 12-20 messages:

- `USER_MESSAGE` from multiple viewers.
- `CREATOR_MESSAGE` from the room creator.
- `SYSTEM_MESSAGE` for go-live and private-session notices.
- `TIP_EVENT`, `MENU_EVENT`, and `GOAL_EVENT` messages tied to tips where possible.
- One soft-deleted message and one reported message for moderation views.

### Wallets And Ledger

Wallet balances should match ledger histories. Seed:

- A funded viewer with purchases, tips, and enough balance for private requests.
- A low-balance viewer with 10-25 tokens for insufficient-balance testing.
- A viewer with reserved private-session tokens.
- Creator wallets with tip and private-session earnings.

Ledger entries should include:

- `TOKEN_PURCHASE`, `TIP_SENT`, `TIP_RECEIVED`, `PRIVATE_SESSION_HOLD`, `PRIVATE_SESSION_CAPTURE`, `PRIVATE_SESSION_RELEASE`, `REFUND_REVERSAL`, `CHARGEBACK_REVERSAL`, and `ADMIN_ADJUSTMENT`.

### Payments

Seed payment transactions across all major states:

- `APPROVED` with `providerTxnId`, `approvedAt`, credited tokens, and matching ledger entry.
- `PENDING` with `checkoutUrl`.
- `DECLINED` and `FAILED` with raw provider metadata.
- `REFUNDED` and `CHARGEBACK` with reversal ledger entries.
- `MANUAL_REVIEW` for admin operations.

Use clearly fake CCBill-like IDs such as `dev-ccbill-approved-001`.

### Tips

Seed tips across request types and statuses:

- `GENERAL` tip, `SENT`.
- `MENU_ITEM` tip, `ACKNOWLEDGED`.
- `CUSTOM` tip, `COMPLETED`.
- `GOAL` tip, `COMPLETED`.
- One `DECLINED` or `REVERSED` historical tip for admin/accounting displays.

Tips should have matching viewer and creator ledger entries.

### Private Sessions

Create a full state ladder:

- `REQUESTED` with reserved tokens and a hold ledger entry.
- `ACCEPTED` waiting to start.
- `ACTIVE` with `livekitRoomName`.
- `ENDED` with captured and released tokens.
- `DECLINED`, `EXPIRED`, `CANCELLED`, and `FORCE_ENDED` for admin and creator queues.

Use captured rules on each session so changes to creator profile defaults do not rewrite historical terms.

### Reports And Admin Actions

Seed moderation workload:

- `PENDING` report against a room.
- `PENDING` report against a message.
- `REVIEWED` report against media.
- `ACTIONED` report against a user or creator.
- `DISMISSED` report with admin notes.

Admin actions should include creator approval, room hide, media hide, user suspension, wallet adjustment, and forced private-session end.

## Implementation Plan

1. Split seed data into helpers inside `packages/db/prisma/seed.ts`, or add `packages/db/prisma/seed-data.ts` if the file starts getting noisy.
2. Use stable IDs and slugs for demo-critical records so docs and QA scripts can link to them.
3. Create users first, then wallets, profiles, media, rooms, room menus, goals, payments, tips, sessions, reports, and admin actions.
4. Prefer `upsert` for uniquely addressable records and `deleteMany/createMany` for deterministic dependent demo records.
5. Keep wallet balances consistent by computing ledger entries in order, not by hand-editing final balances independently.
6. Add a final seed summary that prints persona credentials and direct demo routes.

## Seed Script

The seed implementation lives at `packages/db/prisma/seed.ts` and is wired to the existing root command:

```bash
pnpm db:seed
```

It can also be run directly for the database package:

```bash
pnpm --filter @streamyolo/db db:seed
```

## Acceptance Criteria

- Running `pnpm --filter @streamyolo/db db:seed` succeeds on a fresh database and can run repeatedly.
- `/rooms` shows multiple live public rooms with non-empty cards.
- A live room page shows thumbnail, creator, viewer count, chat, tip menu, and goal data.
- Admin pages have visible rows for users, creators, rooms, payments, wallets, reports, private sessions, and media.
- Wallet pages show a realistic ledger with purchase, tip, private-session, and adjustment entries.
- Go-live eligibility can be tested for success and for at least three failure modes.
- Payment/admin review pages include approved, pending, failed, refunded, chargeback, and manual-review records.

## Follow-Up App Fixes Recommended

- Include `thumbnailUrl`, `coverUrl`, and creator `avatarUrl` in room API responses, or update the web app to resolve `MediaAsset` records by ID.
- Format room detail responses through the same formatter used by list responses so `RoomPage` receives consistent shapes.
- Confirm chat formatter returns the field expected by the web app; the room page currently renders `m.content`, while the schema stores `body`.
- Add seed-focused tests that assert the seeded browse page, wallet page, and admin overview have non-empty data.
