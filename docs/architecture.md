# Architecture

## Overview

StreamYolo is a PNPM monorepo. All data flows through a single OpenAPI spec that wires Fastify on the server side and the typed `openapi-fetch` client on the frontend.

```
packages/api-spec/openapi.yaml
        │
        ├─── Fastify (fastify-openapi-glue maps operationId → handler)
        │
        └─── packages/sdk (openapi-typescript generates types.ts)
                    │
                    └─── apps/web (React Query hooks consume typed client)
```

## Request lifecycle

1. Browser calls a hook from `@streamyolo/sdk`
2. Hook calls `getApiClient().GET/POST/PATCH/DELETE` — path/params/body fully typed from spec
3. Request hits Fastify on `:3001`; `fastify-openapi-glue` validates and routes by `operationId`
4. Handler delegates to a service; service reads/writes Prisma + MySQL
5. Response shape is validated against spec schema before the hook receives it

## Realtime (Socket.IO)

Socket.IO is attached to the same HTTP server as Fastify:

```ts
// apps/server/src/index.ts
const io = new Server(fastify.server)
// Access in handlers: (request.server as any).io
```

Events: `chat:message`, `tip:received`, `room:state`, `session:state`. Types live in `packages/shared/src/types/`.

## Auth

- Session-based: `POST /auth/login` sets an HTTP-only cookie containing a signed session ID
- `bearerAuth` security handler (`plugins/security.ts`) resolves session from cookie or `Authorization: Bearer` header
- `adminAuth` is an additional check for `role === 'ADMIN'`
- Password hashing: **argon2** (not bcrypt)

## Video (LiveKit)

- Server issues LiveKit access tokens via `POST /livekit/token`
- Browser joins via `@livekit/components-react` using the token + `VITE_LIVEKIT_URL`
- LiveKit Cloud handles all media routing; no media passes through this server

## Payments (CCBill)

1. Client calls `POST /payments/ccbill/checkout` → server creates a `PaymentTransaction` (PENDING) and returns a CCBill checkout URL
2. Browser redirects to CCBill; user pays
3. CCBill POSTs a signed webhook to `POST /webhooks/ccbill`
4. Server verifies signature, sets `PaymentTransaction.status = APPROVED`, credits tokens via a `LedgerEntry`
5. Idempotency: `providerTxnId @unique` prevents duplicate credits

## Token ledger

The `LedgerEntry` table is append-only — no `updatedAt`. Wallet balance is always derived from the ledger, never stored separately and mutated. Types: `TOKEN_PURCHASE`, `TIP_SENT`, `TIP_RECEIVED`, `PRIVATE_SESSION_HOLD`, `PRIVATE_SESSION_CAPTURE`, `PRIVATE_SESSION_RELEASE`, `REFUND_REVERSAL`, `CHARGEBACK_REVERSAL`, `ADMIN_ADJUSTMENT`.

## Media storage

- Dev: `MediaService.upload` writes files to `STORAGE_LOCAL_PATH` on disk
- Production: swap the implementation for S3 / Cloudflare R2 — the handler interface is unchanged
- All media goes through admin review before being displayed (`MediaAsset.status = PENDING → APPROVED`)

## Go-live eligibility

A creator can only go live if all of the following are true:
- `CreatorProfile.status === 'ACTIVE'` (admin approved)
- Room has `thumbnailMediaId` set (approved thumbnail)
- Room has a non-empty `title`
- Creator has `privateRulesText` set
- Creator has `privateRateTokensPerMinute > 0`
- Creator has at least one active `CreatorMenuItem`
