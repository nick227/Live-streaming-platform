# Railway Go-Live Guide

## Service layout

| Railway service | Type | What it runs |
|---|---|---|
| `streamyolo-server` | Web service | Fastify + Socket.IO (`apps/server`) |
| `streamyolo-web` | Static site | Vite SPA (`apps/web/dist`) |
| `streamyolo-db` | MySQL plugin | Managed MySQL 8 |
| `streamyolo-redis` | Redis plugin | Socket.IO adapter (add before multi-replica) |

---

## Prerequisites

- Railway account at [railway.app](https://railway.app)
- Railway CLI: `npm install -g @railway/cli` then `railway login`
- LiveKit Cloud project — get URL, API key, secret at [livekit.io](https://livekit.io)
- Cloudflare R2 bucket (or other S3-compatible storage) for media uploads
- CCBill merchant account with a FlexForm configured

---

## First deploy

### 1. Create a Railway project

```bash
railway init          # creates a new project and links this directory
```

Or create via the Railway dashboard and then:

```bash
railway link          # link this directory to the existing project
```

### 2. Add the MySQL plugin

In the Railway dashboard → your project → **New** → **Database** → **MySQL**.

Railway injects `MYSQL_URL` automatically. You will reference it as `DATABASE_URL` — copy the connection string and set it as a variable on the server service (see step 4).

### 3. Create the server service

In the dashboard → **New** → **GitHub Repo** → select this repo.

Set the service settings:

| Setting | Value |
|---|---|
| Root Directory | `/` |
| Config file | `railway.toml` (auto-detected) |

`railway.toml` handles build, release (migrations), start, and health check automatically.

### 4. Set environment variables on the server service

In the dashboard → server service → **Variables** → add each of the following:

```
# Database — paste the MySQL plugin connection string
DATABASE_URL=mysql://...

# Server
NODE_ENV=production
PORT=3001
SESSION_SECRET=<min 32 random chars — generate with: openssl rand -hex 32>
CORS_ORIGIN=https://your-web-domain.com

# LiveKit
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxx
LIVEKIT_API_SECRET=your-livekit-secret

# CCBill
CCBILL_CLIENT_ACCOUNT_NUM=your-account
CCBILL_CLIENT_SUB_ACCOUNT_NUM=your-subaccount
CCBILL_SALT=your-salt
CCBILL_FLEX_ID=your-flexform-id

# Media storage (Cloudflare R2)
STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
STORAGE_BUCKET=streamyolo-media
STORAGE_REGION=auto
STORAGE_ACCESS_KEY=your-r2-access-key
STORAGE_SECRET_KEY=your-r2-secret-key
STORAGE_BASE_URL=https://media.yourdomain.com
```

Do **not** set `STORAGE_LOCAL_PATH` in production — leave it unset so the S3 branch activates.

### 5. Deploy the server

```bash
railway up --service streamyolo-server
```

Railway will:
1. Run `pnpm install --frozen-lockfile` → triggers `prisma generate` via postinstall
2. Run `pnpm --filter server build` → compiles TypeScript to `apps/server/dist/`
3. Run the **release command**: `pnpm db:migrate` → applies Prisma migrations to the production DB
4. Start the process: `node apps/server/dist/index.js`
5. Probe `GET /health` — service goes live once it returns 200

Confirm it worked:

```bash
railway logs --service streamyolo-server
# Should end with: Server listening on port 3001
```

### 6. Deploy the web app

#### Option A — Railway static site (simplest)

In the dashboard → **New** → **GitHub Repo** → same repo → then configure the service:

| Setting | Value |
|---|---|
| Root Directory | `/` |
| Build Command | `pnpm install --frozen-lockfile && pnpm --filter web build` |
| Publish Directory | `apps/web/dist` |

Set build-time variables (**Variables** tab → these are inlined into the JS bundle):

```
VITE_API_URL=https://<server-service>.railway.app
VITE_SOCKET_URL=https://<server-service>.railway.app
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
```

The `public/_redirects` file in the repo handles React Router — all routes serve `index.html`.

#### Option B — Cloudflare Pages (recommended for production)

Cloudflare Pages gives global CDN, better SPA routing support, and zero egress cost.

1. In Cloudflare dashboard → **Pages** → **Connect to Git** → select this repo
2. Set:
   - Build command: `pnpm install --frozen-lockfile && pnpm --filter web build`
   - Build output directory: `apps/web/dist`
3. Add the three `VITE_*` environment variables
4. Cloudflare Pages respects `public/_redirects` automatically

---

## CCBill webhook

After the server is live and has a public URL, configure the webhook in the CCBill merchant portal:

- URL: `https://<server-domain>/webhooks/ccbill`
- Events: `NewSaleSuccess`, `RenewalSuccess`, `Chargeback`, `Refund`

The endpoint verifies the CCBill signature using `CCBILL_SALT` — ensure that variable matches your CCBill account settings exactly.

---

## Custom domains

1. Railway dashboard → service → **Settings** → **Custom Domain**
2. Add your domain and follow the DNS instructions (CNAME to Railway)
3. Update `CORS_ORIGIN` on the server service to match the web domain
4. Update `VITE_API_URL` / `VITE_SOCKET_URL` on the web service to match the API domain and redeploy

---

## Seed data (optional)

After the first deploy you can seed the production database from your local machine:

```bash
# Point at the Railway DB, not your local one
DATABASE_URL="mysql://..." pnpm db:seed
```

Do not seed production with the dev seed — it creates accounts with known passwords.

---

## Ongoing deploys

Every push to the branch linked in the Railway dashboard triggers a new deploy automatically. The release command (`pnpm db:migrate`) runs on every deploy before traffic switches — migrations are applied before the new server starts.

To deploy manually:

```bash
railway up --service streamyolo-server
```

---

## Adding Redis for multi-replica (when needed)

1. Railway dashboard → **New** → **Database** → **Redis**
2. Install the adapter: `pnpm --filter server add @socket.io/redis-adapter ioredis`
3. In `apps/server/src/index.ts`, add after `io` is created:

```ts
import { createAdapter } from '@socket.io/redis-adapter'
import { Redis } from 'ioredis'

const pubClient = new Redis(process.env.REDIS_URL!)
const subClient = pubClient.duplicate()
io.adapter(createAdapter(pubClient, subClient))
```

4. Set `REDIS_URL` on the server service (Railway injects it from the Redis plugin)
5. Scale the server service to 2+ replicas — Socket.IO events now broadcast across all instances

---

## Troubleshooting

**`pnpm db:migrate` fails in release phase**

Check `DATABASE_URL` is set correctly on the server service. The MySQL plugin connection string uses `mysql://` — ensure it matches the Prisma provider.

**`NS_ERROR_CONNECTION_REFUSED` / CORS errors from web**

The server isn't listening. Check `railway logs --service streamyolo-server` for the crash reason. Common causes: missing `DATABASE_URL`, missing LiveKit env vars (production throws on startup if any are missing), port conflict.

**LiveKit token endpoint returns 502**

`LIVEKIT_URL`, `LIVEKIT_API_KEY`, or `LIVEKIT_API_SECRET` is missing or wrong. In production the server refuses to start without them — check the logs.

**Media uploads 500**

`STORAGE_ENDPOINT` is set but `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, or `STORAGE_SECRET_KEY` is missing. Verify all four R2 variables are present on the server service.

**Socket.IO connections drop after deploy**

Railway performs a rolling restart — existing WebSocket connections are dropped. Clients reconnect automatically. If connections drop continuously, check memory usage; Socket.IO in-memory state (viewer counts) resets on each restart, which is expected until Redis is added.
