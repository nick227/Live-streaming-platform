# Admin Guide

## Access

Admin accounts have `role = 'ADMIN'`. The seed script creates one dev admin:

| Email | Password |
|---|---|
| `admin@dev.local` | `password123` |

In production, create an admin directly via Prisma Studio or a SQL query — there is no self-service admin registration:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@yourdomain.com';
```

The `/admin/*` routes require the `adminAuth` security handler (enforced server-side). Non-admins receive HTTP 403.

## Admin panel pages

| Route | Page |
|---|---|
| `/admin` | Overview — total rooms, users, creators, reports, payments, sessions |
| `/admin/rooms` | All rooms with status + end/hide actions |
| `/admin/rooms/:roomId` | Room detail — thumbnail, creator info, force-end button |
| `/admin/users` | User list with role, status, suspend/restore links |
| `/admin/users/:userId` | User detail — wallet, creator profile if applicable |
| `/admin/users/:userId/wallet` | Wallet ledger + manual token adjustment |
| `/admin/creators` | Creator list with live indicator + approve/suspend |
| `/admin/payments` | Payment transaction list with amounts, status |
| `/admin/payments/:paymentId` | Payment detail — CCBill txn ID, timestamps |
| `/admin/private-sessions` | Active and recent private sessions + force-end |
| `/admin/media` | Media pending review — approve or hide |
| `/admin/reports` | User-submitted reports — review action |

## Creator approval workflow

1. Creator registers, sets up profile (bio, stage name, private rate, rules, menu items)
2. Creator uploads a room thumbnail (`MediaAsset` created, status = `PENDING`)
3. Admin reviews the thumbnail at `/admin/media` → Approve or Hide
4. Admin views the creator at `/admin/creators` → Approve (sets `CreatorProfile.status = ACTIVE`)
5. Creator can now go live

A creator cannot go live until:
- `CreatorProfile.status === 'ACTIVE'` (admin approval)
- Room has an approved `thumbnailMediaId`
- Room has a title
- Creator has `privateRulesText` and `privateRateTokensPerMinute > 0`
- Creator has at least one active menu item

## Suspending a user

`PATCH /admin/users/:userId/suspend` sets `User.suspendedAt = now()`. Suspended users:
- Cannot log in (session lookup rejects them)
- Receive HTTP 403 on all authenticated routes
- Are shown as SUSPENDED in the admin list with a Restore link

`PATCH /admin/users/:userId/restore` clears `suspendedAt`.

## Token adjustments

`POST /admin/wallets/:userId/adjust` creates a `LedgerEntry` of type `ADMIN_ADJUSTMENT` with a positive or negative `amountTokens`. The wallet balance is the sum of all ledger entries — there is no balance column to edit directly.

## Force-ending sessions and rooms

- **Room**: `POST /admin/rooms/:roomId/end` — terminates an active LiveKit session and sets room status to `OFFLINE`
- **Private session**: `POST /admin/private-sessions/:sessionId/force-end` — captures final billing, releases the token hold, and marks the session `ENDED`

Both accept an optional `reason` string that is logged.

## Media review

All uploaded media starts at `status = PENDING`. Media is not served publicly until an admin approves it. The `/admin/media` page lists all pending assets with image previews. Actions:
- **Approve** → `MediaAsset.status = APPROVED`; the file URL becomes accessible
- **Hide** → `MediaAsset.status = HIDDEN`; URL remains inaccessible

Room thumbnails must be `APPROVED` before `Room.thumbnailMediaId` satisfies the go-live check.

## Reports

Users can report rooms and other users via `POST /reports`. Reports appear at `/admin/reports` with reason, target type, and reporter. Clicking Review navigates to the relevant admin detail page. Reports are informational — no automated action is taken.

## API routes used by admin pages

All admin routes require `adminAuth`. The full list is in `packages/api-spec/openapi.yaml` under the `admin` tag. Corresponding server handlers are in `apps/server/src/handlers/admin.ts` and the service layer in `apps/server/src/services/AdminService.ts`.
