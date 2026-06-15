# Deployment

## Overview

StreamYolo is a standard Node.js + Vite monorepo. The server runs as a persistent Node process; the web app is a static bundle served from a CDN or reverse proxy.

## Build

```bash
pnpm --filter db migrate:deploy   # run migrations against production DB
pnpm --filter server build        # outputs to apps/server/dist/
pnpm --filter web build           # outputs to apps/web/dist/
```

## Server (API + Socket.IO)

The compiled server is a single Node.js process.

### Environment variables

Set all variables from `.env.example` on the host. Key production values:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Managed MySQL (PlanetScale, Railway, RDS, etc.) |
| `SESSION_SECRET` | Min 32 random chars — rotate with care (invalidates all sessions) |
| `CORS_ORIGIN` | Exact origin of the web app, e.g. `https://streamyolo.com` |
| `STORAGE_LOCAL_PATH` | Leave empty in production; use S3 vars instead |
| `STORAGE_ENDPOINT` | S3-compatible endpoint (Cloudflare R2, AWS S3, Backblaze B2) |
| `STORAGE_BUCKET` | Bucket name |
| `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` | IAM credentials with put/get on the bucket |
| `STORAGE_PUBLIC_URL` | Base URL served to browsers, e.g. `https://media.streamyolo.com` |

### Swap local disk storage for S3

`MediaService.upload` in `apps/server/src/services/MediaService.ts` writes to local disk by default. In production, replace it with an S3 client call (AWS SDK v3 or `@aws-sdk/client-s3`). The handler interface is unchanged.

### Process management

Use PM2 or a systemd service:

```bash
# PM2
pm2 start apps/server/dist/index.js --name streamyolo-server
pm2 save
```

Or run via Docker:

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm --filter server build
CMD ["node", "apps/server/dist/index.js"]
```

### Reverse proxy (nginx)

The server and Socket.IO both run on `PORT` (default 3001). WebSocket upgrades must pass through:

```nginx
location / {
    proxy_pass         http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_set_header   Host $host;
}
```

## Web app (static)

Deploy `apps/web/dist/` to any static host (Cloudflare Pages, Vercel, S3 + CloudFront, nginx).

Set these `VITE_*` variables **at build time** (they are inlined into the bundle):

```bash
VITE_API_URL=https://api.streamyolo.com
VITE_SOCKET_URL=https://api.streamyolo.com
VITE_LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
```

React Router uses client-side routing — configure your host to serve `index.html` for all routes:

- **Cloudflare Pages**: `_redirects` file: `/* /index.html 200`
- **nginx**: `try_files $uri /index.html;`
- **Vercel**: `vercel.json` rewrites all to `/`

## Database migrations

Run Prisma migrations before starting the new server version:

```bash
pnpm --filter db migrate:deploy
```

This is a forward-only, non-destructive migration. Never run `migrate:reset` in production.

## CCBill webhook

CCBill POSTs to `POST /webhooks/ccbill` after successful payments. The URL must be publicly reachable. Configure it in the CCBill merchant portal under your FlexForm settings.

Webhook requests are signature-verified using `CCBILL_WEBHOOK_SECRET` — do not expose this value.

## LiveKit

No LiveKit server infrastructure is needed — StreamYolo uses LiveKit Cloud. Keep `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` server-side only; the web app never sees them. The web app uses `VITE_LIVEKIT_URL` to connect to the LiveKit Cloud room after receiving a token from `POST /livekit/token`.

## Health check

`GET /health` returns `{ status: "ok" }` with HTTP 200. Use it for load balancer and uptime monitoring probes.
