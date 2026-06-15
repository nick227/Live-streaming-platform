# Repository Structure / Folder Convention Guide

Recommended monorepo:

```txt
streamyolo/
  apps/
    web/
      src/
        app/
        pages/
        routes/
        components/
        features/
        lib/
        styles/
        types/
    api/
      src/
        server.ts
        app.ts
        config/
        modules/
        plugins/
        shared/
        workers/
  packages/
    shared/
      src/
        types.ts
        constants.ts
        schemas.ts
    ui/
      src/
        components/
        tokens/
        hooks/
  prisma/
    schema.prisma
    migrations/
    seed.ts
  docs/
  scripts/
  .github/
```

## API module convention

```txt
apps/api/src/modules/
  auth/
    auth.routes.ts
    auth.service.ts
    auth.types.ts
  rooms/
    rooms.routes.ts
    rooms.service.ts
    rooms.repository.ts
  livekit/
    livekit.provider.ts
    videoProvider.ts
  chat/
    chat.socket.ts
    chat.service.ts
  wallet/
    wallet.service.ts
    ledger.service.ts
  payments/
    paymentProvider.ts
    ccbill.provider.ts
    payments.routes.ts
    webhooks.routes.ts
  privateSessions/
  admin/
  media/
```

## Frontend feature convention

```txt
apps/web/src/features/
  room/
    RoomPage.tsx
    RoomVideoSurface.tsx
    RoomChatRail.tsx
    TipMenuPanel.tsx
  creatorStudio/
    CreatorStudioPage.tsx
    GoLiveChecklist.tsx
    ThumbnailPanel.tsx
    PrivateQueue.tsx
  wallet/
  tokens/
  admin/
```

## Shared package

Use shared types for:
- DTOs.
- enums/unions.
- Socket event contracts.
- validation schemas if using zod.

Avoid importing server-only Prisma types directly into frontend.
