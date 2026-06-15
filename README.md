# StreamYolo

Room-first live creator platform — creators go live with LiveKit video, viewers chat and tip with tokens via Socket.IO, and paid private sessions are metered per minute with CCBill real-money token purchases.

## Quick start

### Prerequisites

- Node.js 20+
- PNPM 9+ (`npm i -g pnpm`)
- MySQL 8+ or MariaDB 10.6+
- LiveKit Cloud account (or self-hosted)
- CCBill merchant account (optional for local dev)

### First-time setup

```bash
cp .env.example .env
# fill in DATABASE_URL, SESSION_SECRET, LIVEKIT_* at minimum

pnpm bootstrap
```

`pnpm bootstrap` runs in order:
1. `pnpm install`
2. `pnpm sdk:generate` — generates TypeScript types from OpenAPI spec
3. `pnpm --filter db db:push` — applies Prisma schema to your database
4. `pnpm --filter db db:seed` — seeds token packs + dev users

### Dev users (after seed)

| Email | Password | Role |
|---|---|---|
| `admin@dev.local` | `password123` | ADMIN |
| `creator@dev.local` | `password123` | CREATOR (approved, ACTIVE) |
| `viewer@dev.local` | `password123` | VIEWER (1000 tokens) |

### Start development servers

```bash
pnpm --filter server dev   # API → http://localhost:3001
pnpm --filter web dev      # Web → http://localhost:5173
```

## Environment variables

Copy `.env.example` to `.env`. Required:

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `SESSION_SECRET` | Random string ≥32 chars |
| `LIVEKIT_URL` | LiveKit server WebSocket URL |
| `LIVEKIT_API_KEY` | LiveKit API key |
| `LIVEKIT_API_SECRET` | LiveKit API secret |
| `VITE_API_URL` | Browser-facing API URL |
| `VITE_LIVEKIT_URL` | Browser-facing LiveKit URL |

CCBill and storage vars are optional locally; payment/upload flows fail gracefully without them.

## Project structure

```
apps/
  web/      Vite + React + TypeScript + Tailwind
  server/   Fastify + Socket.IO + TypeScript
packages/
  api-spec/ OpenAPI 3.0.3 YAML — single source of truth for all routes
  sdk/      openapi-fetch client + React Query hooks
  db/       Prisma schema + seed (MySQL)
  shared/   Socket.IO event types
```

## Key scripts

| Script | Description |
|---|---|
| `pnpm bootstrap` | First-time setup |
| `pnpm sdk:generate` | Regenerate SDK types from OpenAPI spec |
| `pnpm sdk:check` | Verify SDK types match spec (no drift) |
| `pnpm typecheck` | TypeScript check across all packages |
| `pnpm --filter server test` | Run server tests (requires test DB) |

## Architecture

- **OpenAPI is the contract.** Edit `packages/api-spec/openapi.yaml` first. `fastify-openapi-glue` maps `operationId` → handler at startup. `openapi-fetch` types the client from the same spec.
- **SDK is the only frontend bridge.** Pages import hooks from `@streamyolo/sdk` — no raw fetch calls.
- **Socket.IO** shares the Fastify HTTP server. Realtime events (chat, tips, session state) flow through it.
- **LiveKit** handles video. Server issues access tokens; browser uses `@livekit/components-react`.
- **Ledger is append-only.** Token balance is derived from ledger entries, never directly mutated.
- **CCBill webhooks** are idempotent via `providerTxnId @unique` on `PaymentTransaction`.
