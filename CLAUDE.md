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
| API contract | `packages/api-spec` — OpenAPI 3.0.3 YAML |
| SDK | `packages/sdk` — openapi-fetch client + React Query hooks |
| Shared types | `packages/shared` — Socket.IO event types, abstractions |
| Video | LiveKit Cloud (`livekit-server-sdk`) |
| Payments | CCBill (custom PaymentProvider abstraction) |
| Realtime | Socket.IO on server process |

## Deviations from Defaults

- **Socket.IO** added as a realtime layer alongside Fastify
- **LiveKit** (`livekit-server-sdk` server, `@livekit/components-react` web)
- **CCBill** as payment provider (not Stripe)
- **argon2** for password hashing (not bcrypt)
- **OpenAPI 3.0.3** (not 3.1.0 — `nullable: true` pattern used throughout)

## Phase Completed

**Phase 1 — Contract** ✅  
**Phase 2 — Server** ✅  
**Phase 3 — Frontend Shell** ✅  
**Phase 4 — Feature Pages** ✅  
**Phase 5 — Polish** ✅

## Phase 1 Gate Status

- [x] pnpm-workspace.yaml + root package.json + all packages/package.json
- [x] All scripts from templates copied verbatim (bootstrap, check-sdk-drift, generate-tests, generate-docs, generate-pages)
- [x] Prisma schema — MySQL, all models, all enums, correct indexes, @db.Text annotations, MODERATOR role (future), structured private rules
- [x] OpenAPI spec — all routes, all schemas, every operationId, complete coverage of MVP scope
- [x] SDK package — client.ts, index.ts, hooks/useAuth.ts, hooks/index.ts, scripts/generate.ts
- [x] pnpm sdk:generate — types.ts generated
- [x] pnpm sdk:check — no drift
- [x] npx @redocly/cli lint openapi.yaml — validates clean
- [x] pnpm typecheck — server passes

## Phase 2 Gate Status

- [x] `apps/server/src/index.ts` — Fastify + Socket.IO, openapiGlue, multipart, error handler, health check
- [x] `apps/server/src/plugins/security.ts` — bearerAuth (cookie → Bearer header → session lookup → suspendedAt check), adminAuth (role check)
- [x] `apps/server/src/lib/pagination.ts` — encodeCursor, decodeCursor, normalizeLimit
- [x] `apps/server/src/services/AuthService.ts` — register (argon2.hash), login (argon2.verify), logout, _createSession
- [x] `apps/server/src/handlers/auth.ts` — register, login, logout, getCurrentUser
- [x] Domain services: RoomService, CreatorProfileService, CreatorMenuService, LiveKitService, TipService, WalletService, PaymentService (CCBill), PrivateSessionService, MediaService, ReportService, AdminService
- [x] Domain handlers: rooms, creatorProfile, creatorMenu, livekit, chat, tips, tokenPacks, payments, wallet, privateSessions, media, creatorEarnings, reports, admin
- [x] `apps/server/src/handlers/index.ts` — barrel exports all 50 operationId handlers
- [x] `apps/server/src/__tests__/helpers/index.ts` + `setup.ts` — StreamYolo-adapted (no profile model, FK-safe delete order)
- [x] `apps/server/vitest.config.ts`
- [x] `pnpm test:generate` — 16 test files generated (50 operations total)
- [x] `pnpm --filter server typecheck` — clean

## Phase 2 Pending (gate items to verify manually)

- [ ] `pnpm --filter server dev` — server starts without errors (requires .env with DATABASE_URL, LIVEKIT_*, CCBILL_*)
- [ ] Auth routes work end-to-end (register → cookie → GET /auth/me returns user)
- [ ] `pnpm test` passes (requires test DB)

## Phase 3 Gate Status

- [x] Tailwind config + CSS variable tokens (StreamYolo dark/light theme)
- [x] UI primitives: Button (cva, 5 variants), Input (voice-enabled), Textarea (voice), Card, Avatar, EmptyState, Skeleton, Spinner, Form (declarative FieldConfig + zod)
- [x] Voice hooks: `useSpeechRecognition`, `VoiceButton` (Mic/MicOff toggle)
- [x] Shell layout — fixed sidebar (desktop 256px) + bottom nav (mobile), dark mode toggle, logout
- [x] `apps/web/src/main.tsx` — QueryClientProvider + createApiClient + Toaster
- [x] `apps/web/src/lib/AuthGuard.tsx`, `queryClient.ts`, `theme.ts`, `utils.ts`
- [x] `apps/web/src/lib/theme.ts` — reads localStorage/prefers-color-scheme, sets `.dark` before React mounts
- [x] `pnpm pages:generate` — App.tsx + 54 page stubs generated
- [x] SDK hooks barrel-exported from `packages/sdk/src/hooks/index.ts`:
  - `useAuth.ts` — useCurrentUser, useLogin, useRegister, useLogout
  - `useRooms.ts` — useRooms, useRoom, usePrepareRoom, useGoLive, useEndRoom, useRoomMessages, useRoomMenu
  - `useCreator.ts` — useCreatorProfile, useUpdateCreatorProfile, useCreatorMenuItems, useCreateCreatorMenuItem, useUpdateCreatorMenuItem, useDeleteCreatorMenuItem, useCreatorEarnings, useGetLivekitToken, useAcknowledgeTip, useCompleteTip
  - `useTips.ts` — useCreateTip
  - `useTokenPacks.ts` — useTokenPacks
  - `usePayments.ts` — useCreateCcbillCheckout, useHandleCcbillWebhook
  - `useWallet.ts` — useWallet
  - `usePrivateSessions.ts` — useRequestPrivateSession, useAcceptPrivateSession, useDeclinePrivateSession, useStartPrivateSession, useEndPrivateSession
  - `useMedia.ts` — useUploadMedia, useCaptureRoomThumbnail
  - `useReports.ts` — useCreateReport
  - `useAdmin.ts` — all 23 admin hooks (overview, rooms, users, creators, payments, wallets, private sessions, media, reports)
- [x] `pnpm --filter web typecheck` — clean

## Architecture Notes

- **OpenAPI is the contract.** Every Fastify route is in the spec. `fastify-openapi-glue` maps `operationId` → handler at startup. No `fastify.get/post/patch/delete()` anywhere.
- **Go-live eligibility requires:** creator status = ACTIVE (admin approved), room has thumbnailMediaId set, room has title, creator has privateRulesText + privateRateTokensPerMinute > 0, creator has at least one active menu item.
- **Ledger is append-only.** No `updatedAt` on `LedgerEntry`. Webhook idempotency via `providerTxnId @unique` on `PaymentTransaction`.
- **Private rules are structured** on both `CreatorProfile` (defaults) and `PrivateSession` (captured at request time).
- **Admin approval is required** before creator can go live. `CreatorProfile.status` must be `ACTIVE`.
- **Room thumbnail is required specifically** — `Room.thumbnailMediaId` must be set; avatar/logo do not count.
- **MODERATOR role** is in the DB enum and spec but has no logic in V1.
- **Socket.IO** is attached to the same HTTP server as Fastify. Access via `(request.server as any).io` in handlers.
- **Media uploads** are saved to local disk (`STORAGE_LOCAL_PATH` env) in dev; swap `MediaService.upload` for S3/R2 in production.
- **ApiError constructor**: `new ApiError(statusCode: number, message: string)` — status first, message second.
- **Button loading prop**: use `loading` (not `isLoading`) — renders Spinner inside button when true.
- **List page stubs**: use `data?.data ?? []` (not `data?.pages.flatMap(...)`) — hooks use `useQuery`, not `useInfiniteQuery`.
- **Action page stubs with path params**: use `useParams()` to extract ID, inject into mutation args.
- **Button asChild**: Button supports `asChild` prop via React.cloneElement — applies buttonVariants className to child element (used with `<Link>`).
- **Avatar prop**: use `name` (not `fallback`) for initials fallback.
- **LedgerEntryRow**: expects `entry.amountTokens` (not `entry.amount`) — matches API `LedgerEntryDto`.
- **Wallet/earnings data paths**: `useWallet()` returns `data.data.wallet.tokenBalance` + `data.data.ledger`; `useCreatorEarnings()` returns `data.data.pendingTokenBalance` + `data.data.ledger`.
- **RoomMenu data**: `useRoomMenu()` returns `data.data.items` (object with `items[]` + optional `goal`), not a flat array.

## Phase 4 Gate Status

- [x] All MVP feature pages built with real component renders (no JSON.stringify stubs)
- [x] Feature components: RoomCard, LedgerEntryRow, TokenPackCard, MenuItemCard, StatCard, StatusBadge
- [x] Admin panel: AdminOverviewPage (stat cards), AdminRoomsPage/UsersPage/CreatorsPage/PaymentsPage/PrivateSessionsPage/MediaPage/ReportsPage (list rows + StatusBadge + action links), AdminRoomPage/UserPage/WalletPage/PaymentPage (detail cards)
- [x] App.tsx duplicate routes fixed: /creator/profile/edit, /creator/menu-items/new
- [x] `pnpm --filter web typecheck` — clean

## Phase 5 Gate Status

- [x] Skeleton loaders for all content areas (list pages + detail pages)
- [x] Error boundaries — `ErrorBoundary` class component wrapping `<Outlet />` in Shell via `key={pathname}` (resets on navigation)
- [x] Toast notifications on all mutations — every `mutateAsync` has `try/catch` with `toast.success` / `toast.error`
- [x] `.env.example` finalized — includes `STORAGE_LOCAL_PATH` for local dev
- [x] `README.md` — setup steps, dev users, project structure, architecture notes
- [x] Seed script — token packs + 3 dev users (admin/creator/viewer) + creator profile + tip menu + dev room
- [x] `pnpm --filter web typecheck` — clean

## Phase 5 Pending (requires real env)

- [ ] `pnpm bootstrap` — run end-to-end on fresh checkout
- [ ] `pnpm --filter server dev` + `pnpm --filter web dev` — both servers start
- [ ] Auth flow confirmed in browser (register → login → protected route → logout)

## Phase 6 Gate Status

- [x] `pnpm docs:generate` — `docs/api-reference.md`, `docs/env-vars.md`, `docs/database.md` generated
- [x] `docs/architecture.md` — system overview, request lifecycle, auth, video, payments, ledger, go-live rules
- [x] `docs/setup.md` — prereqs, first-time bootstrap, env vars, DB seed, dev server start, test commands
- [x] `docs/sdk.md` — client setup, data path notes, full hook index, how to add a new hook
- [x] `docs/deployment.md` — build, S3 swap, nginx/PM2, migrations, CCBill webhook, health check
- [x] `docs/admin.md` — access, panel pages, creator approval, suspend/restore, token adjust, media review

## Phase 2 Pending (manual verification — requires real .env)

- [ ] `pnpm --filter server dev` — server starts without errors
- [ ] Auth routes work end-to-end (register → cookie → GET /auth/me returns user)
- [ ] `pnpm test` passes (requires test DB)

## Phase 5 Pending (manual verification — requires real .env)

- [ ] `pnpm bootstrap` — run end-to-end on fresh checkout
- [ ] `pnpm --filter server dev` + `pnpm --filter web dev` — both servers start
- [ ] Auth flow confirmed in browser (register → login → protected route → logout)

## Next Session

All 6 phases complete. Ready for manual verification against a real environment (MySQL/MariaDB + LiveKit + CCBill credentials).
