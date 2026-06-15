# Setup Guide

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 20 |
| PNPM | 9 |
| MySQL | 8+ (or MariaDB 10.6+) |
| LiveKit Cloud account | — |
| CCBill merchant account | — |

Install PNPM globally if needed:
```bash
npm install -g pnpm@9
```

## First-time setup

```bash
git clone <repo>
cd streamyolo
pnpm bootstrap
```

`pnpm bootstrap` runs: `pnpm install` → `pnpm db:generate` → `pnpm sdk:generate`.

## Environment variables

Copy `.env.example` to the repository root `.env`:

```bash
cp .env.example .env
```

Edit `.env`. Required values:

| Variable | Where | Notes |
|---|---|---|
| `DATABASE_URL` | server/db | MySQL connection string (`mysql://user:pass@host:3306/db`) |
| `SESSION_SECRET` | server | Min 32 random chars |
| `LIVEKIT_URL` | server | `wss://` URL from LiveKit dashboard |
| `LIVEKIT_API_KEY` | server | From LiveKit dashboard |
| `LIVEKIT_API_SECRET` | server | From LiveKit dashboard |
| `CCBILL_*` | server | CCBill variables from merchant portal |
| `STORAGE_LOCAL_PATH` | server | Dev only — directory for uploaded files |
| `VITE_API_URL` | web | `http://localhost:3001` for local dev |
| `VITE_LIVEKIT_URL` | web | Browser-facing LiveKit URL |

## Database

```bash
# Create database and run migrations
pnpm db:migrate

# Seed dev data (admin, creator, viewer users + token packs)
pnpm db:seed
```

Seeded accounts:

| Email | Password | Role |
|---|---|---|
| `admin@dev.local` | `password123` | ADMIN |
| `creator@dev.local` | `password123` | CREATOR (ACTIVE, approved) |
| `viewer@dev.local` | `password123` | VIEWER (1000 tokens) |

## Start dev servers

```bash
# Two separate terminals:
pnpm --filter server dev   # API at http://localhost:3001
pnpm --filter web dev      # Web at http://localhost:5173
```

Or with a process manager like `concurrently` in the root:

```bash
pnpm dev
```

## Verify the setup

1. Open `http://localhost:5173`
2. Sign in as `viewer@dev.local` / `password123`
3. Visit `/wallet` — should show 1000 tokens
4. Sign out, sign in as `creator@dev.local` / `password123`
5. Visit `/creator/profile` — should show ACTIVE status

## Running tests

```bash
pnpm test           # all server unit/integration tests via Vitest
pnpm typecheck      # TypeScript across all packages
pnpm lint           # ESLint
```

Tests require a running MySQL/MariaDB database. The test runner creates and tears down a separate test schema automatically (see `apps/server/src/__tests__/setup.ts`).

## Regenerating the SDK

After editing `packages/api-spec/openapi.yaml`:

```bash
pnpm sdk:generate   # regenerates packages/sdk/src/generated/types.ts
pnpm sdk:check      # fails if committed types.ts is out of sync
```

After adding new routes, regenerate test stubs:

```bash
pnpm test:generate  # appends stubs for new operationIds; never touches filled-in tests
```
