# Environment Setup & Deployment Plan

## Environments

### Local

Developer machine with local MySQL and LiveKit Cloud dev credentials.

### Staging / POC

Railway deployment connected to GitHub branch.

Services:
- Web app.
- API app.
- MySQL.
- Optional Redis later.

### Production later

Separate Railway project or more controlled infrastructure. Not required for POC.

## Railway deployment

Recommended services:

```txt
streamyolo-api
streamyolo-web
streamyolo-mysql
```

Optional:

```txt
streamyolo-redis
streamyolo-worker
```

## Build commands

API:

```bash
npm ci
npx prisma generate
npm run build --workspace apps/api
```

Deploy command:

```bash
npx prisma migrate deploy
node apps/api/dist/server.js
```

Web:

```bash
npm ci
npm run build --workspace apps/web
npm run start --workspace apps/web
```

## Production env vars

- `DATABASE_URL`
- `SESSION_SECRET`
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `CCBILL_*`
- `STORAGE_*`
- `APP_URL`
- `API_URL`

## Deployment checklist

- Run migrations.
- Seed token packs.
- Verify LiveKit token issuance.
- Verify Socket.IO connects.
- Verify CCBill webhook endpoint is public.
- Verify admin login.
- Verify media upload.
- Verify wallet ledger test.
- Run E2E smoke.

## Rollback strategy

- Keep previous Railway deployment available.
- Do not deploy destructive migrations during active POC.
- Feature-flag CCBill live mode.
- Keep admin wallet adjustment available for recovery.
