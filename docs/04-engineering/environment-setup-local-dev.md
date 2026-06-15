# Environment Setup / Local Dev Onboarding Guide

## Prerequisites

- Node.js 22+
- npm or pnpm
- MySQL
- Git
- LiveKit Cloud account
- CCBill sandbox/test account when available
- S3-compatible storage credentials or local mock

## Environment variables

```env
NODE_ENV=development
APP_URL=http://localhost:5173
API_URL=http://localhost:4000
DATABASE_URL=mysql://user:pass@localhost:3306/streamyolo
SESSION_SECRET=replace-me

LIVEKIT_URL=wss://your-livekit-host
LIVEKIT_API_KEY=replace-me
LIVEKIT_API_SECRET=replace-me

CCBILL_CLIENT_ACCOUNT=replace-me
CCBILL_SUBACCOUNT=replace-me
CCBILL_WEBHOOK_SECRET=replace-me
CCBILL_MODE=sandbox

STORAGE_PROVIDER=local
STORAGE_BUCKET=streamyolo-dev
STORAGE_PUBLIC_URL=http://localhost:4000/uploads
```

## Local setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Dev services

Recommended local processes:

```txt
api: localhost:4000
web: localhost:5173
mysql: localhost:3306
```

## Seed data

Seed should create:
- Admin user.
- Viewer user.
- Creator user.
- Creator profile.
- Token packs.
- Example tip menu.
- Example room cover/thumbnail placeholder.

## Local payment testing

Before CCBill sandbox is available:
- Use `DemoPaymentProvider` to simulate approved payment.
- Keep provider interface identical.
- Mark demo payments clearly in admin.

## Local video testing

Use LiveKit Cloud dev project. Local backend issues tokens against LiveKit Cloud.
