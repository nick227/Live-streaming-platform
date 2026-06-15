# StreamYolo — Project State

## MVP

**What it does:** Room-first live creator platform — creators go live with LiveKit video, viewers chat and tip with tokens via Socket.IO, and paid private sessions are metered per minute with CCBill real-money token purchases.

**Users:**
- VIEWER: browse rooms, join, chat, buy tokens (CCBill), tip (general/menu/custom/goal), request private sessions
- CREATOR: all viewer actions + manage profile, set up rooms, go live (requires admin approval + thumbnail + tip menu + private rules), accept/decline private sessions, view earnings
- ADMIN: full operations — rooms, users, creators, payments, wallets, private sessions, media review, reports

**V1 modules:** Auth, CreatorProfile, Room, Wallet/Ledger, Tips/TipMenu, PrivateSession, TokenPacks, CCBill payments, MediaAsset, Reports, Admin

**Parking lot (V2+):** Auto snapshots, recordings, creator analytics, scheduled rooms, notifications, fan clubs, subscriptions, paid DMs, KYC workflow, automated payouts

## Stack

| Layer | Choice |
|---|---|
| Monorepo | PNPM workspaces |
| Web app | `apps/web` — Vite + React + TypeScript + Tailwind |
| API server | `apps/server` — Fastify + TypeScript + Socket.IO |
| Database | `packages/db` — Prisma + **MySQL** |
| API contract | `packages/api-spec` — OpenAPI 3.1 YAML |
| SDK | `packages/sdk` — openapi-fetch client + React Query hooks |
| Shared types | `packages/shared` — Socket.IO event types, abstractions |
| Video | LiveKit Cloud (`@livekit/server-sdk`) |
| Payments | CCBill (custom PaymentProvider abstraction) |
| Realtime | Socket.IO on server process |

## Deviations from Defaults

- **Socket.IO** added as a realtime layer (not in factory template — added as a server-side extension alongside Fastify)
- **LiveKit** client SDK in web app (`@livekit/components-react`)
- **CCBill** as payment provider (not Stripe)
- **argon2** for password hashing (not bcrypt)

## Phase Completed

**Phase 1 — Contract**

## Phase 1 Gate Status

- [x] pnpm-workspace.yaml + root package.json + all packages/package.json
- [x] All scripts from templates copied verbatim (bootstrap, check-sdk-drift, generate-tests, generate-docs, generate-pages)
- [x] Prisma schema — MySQL, all models, all enums, correct indexes, @db.Text annotations, MODERATOR role (future), structured private rules
- [x] OpenAPI spec — all routes, all schemas, every operationId, complete coverage of MVP scope
- [x] SDK package — client.ts, index.ts, hooks/useAuth.ts, hooks/index.ts, scripts/generate.ts
- [ ] pnpm sdk:generate — run after `pnpm install` to produce packages/sdk/src/generated/types.ts
- [ ] pnpm sdk:check — passes after generate
- [ ] npx @redocly/cli lint openapi.yaml — spec validates clean
- [ ] pnpm typecheck — passes across all packages

## Architecture Notes

- **OpenAPI is the contract.** Every Fastify route must be in the spec. `fastify-openapi-glue` maps `operationId` → handler at startup.
- **Go-live eligibility requires:** creator status = ACTIVE (admin approved), room has thumbnailMediaId set, room has title, creator has privateRulesText + privateRateTokensPerMinute > 0, creator has at least one active menu item. These are checked by `GoLiveEligibility` response.
- **Ledger is append-only.** No `updatedAt` on `LedgerEntry`. Webhook idempotency via `providerTxnId @unique` on `PaymentTransaction`.
- **Private rules are structured** on both `CreatorProfile` (defaults) and `PrivateSession` (captured at accept time): `rateTokensPerMinute`, `minMinutes`, `viewerCamRequired`, `screenShareAllowed`, `rulesText`.
- **Admin approval is required** before creator can go live. `CreatorProfile.status` must be `ACTIVE`.
- **Room thumbnail is required specifically** — `Room.thumbnailMediaId` must be set; avatar/logo do not count.
- **MODERATOR role** is in the DB enum and OpenAPI spec but has no logic in V1 — designed for future use.

## Next Session

Start **Phase 2 — Server**. Read `references/fastify-patterns.md` and `references/testing-patterns.md`.

Steps:
6. Scaffold `apps/server/src/index.ts` (Fastify + fastify-openapi-glue + Socket.IO)
7. Auth handlers + AuthService (session cookies, argon2, Session model)
8. Domain handlers — one named export per operationId, delegate to services
9. Domain services — all business logic (RoomService, WalletService, TipService, PrivateSessionService, MediaService, PaymentService, ReportService, AdminService)
10. Test stubs — run `pnpm test:generate`

Phase 2 gate: server starts, auth routes work, all operationIds have handlers, tests pass.
