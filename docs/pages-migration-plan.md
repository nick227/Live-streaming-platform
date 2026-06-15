# Pages Migration Plan

## Goal

Organize `apps/web/src/pages` by product domain instead of keeping every route-level page in one flat folder. The migration should keep component names stable, make imports consistent through barrel files, and reduce noise in `App.tsx`.

## Current Problem

`apps/web/src/pages` currently contains 55 route-level files in a single directory. The names already reveal clear domains, but the flat layout makes scanning, ownership, and future page additions harder than they need to be.

## Target Structure

```txt
apps/web/src/pages/
  index.ts

  auth/
    LoginPage.tsx
    RegisterPage.tsx
    index.ts

  rooms/
    RoomsPage.tsx
    RoomPage.tsx
    RoomMessagesPage.tsx
    RoomMenuPage.tsx
    RoomModerationPage.tsx
    PrepareRoomPage.tsx
    GoLivePage.tsx
    EndRoomPage.tsx
    CaptureRoomThumbnailPage.tsx
    index.ts

  creator/
    CreatorProfilePage.tsx
    UpdateCreatorProfilePage.tsx
    CreatorMenuItemsPage.tsx
    CreateCreatorMenuItemPage.tsx
    UpdateCreatorMenuItemPage.tsx
    CreatorEarningsPage.tsx
    index.ts

  tips/
    CreateTipPage.tsx
    AcknowledgeTipPage.tsx
    CompleteTipPage.tsx
    index.ts

  private-sessions/
    RequestPrivateSessionPage.tsx
    AcceptPrivateSessionPage.tsx
    DeclinePrivateSessionPage.tsx
    StartPrivateSessionPage.tsx
    EndPrivateSessionPage.tsx
    index.ts

  payments/
    TokenPacksPage.tsx
    CreateCcbillCheckoutPage.tsx
    HandleCcbillWebhookPage.tsx
    index.ts

  wallet/
    WalletPage.tsx
    index.ts

  media/
    UploadMediaPage.tsx
    index.ts

  reports/
    CreateReportPage.tsx
    index.ts

  livekit/
    GetLivekitTokenPage.tsx
    index.ts

  admin/
    AdminOverviewPage.tsx
    index.ts

    rooms/
      AdminRoomsPage.tsx
      AdminRoomPage.tsx
      AdminEndRoomPage.tsx
      AdminHideRoomPage.tsx
      index.ts

    users/
      AdminUsersPage.tsx
      AdminUserPage.tsx
      AdminSuspendUserPage.tsx
      AdminRestoreUserPage.tsx
      index.ts

    creators/
      AdminCreatorsPage.tsx
      AdminApproveCreatorPage.tsx
      AdminSuspendCreatorPage.tsx
      index.ts

    payments/
      AdminPaymentsPage.tsx
      AdminPaymentPage.tsx
      index.ts

    wallets/
      AdminWalletPage.tsx
      AdminAdjustWalletPage.tsx
      index.ts

    private-sessions/
      AdminPrivateSessionsPage.tsx
      AdminForceEndPrivateSessionPage.tsx
      index.ts

    media/
      AdminMediaPage.tsx
      AdminApproveMediaPage.tsx
      AdminHideMediaPage.tsx
      index.ts

    reports/
      AdminReportsPage.tsx
      AdminReviewReportPage.tsx
      index.ts
```

## Barrel File Rules

Each domain folder should export only the page components it owns. Avoid exporting helpers, fixtures, or domain-specific child components from `pages`; those should live under `components`, `features`, or a local subfolder if they appear later.

Example domain barrel:

```ts
// apps/web/src/pages/auth/index.ts
export { LoginPage } from './LoginPage'
export { RegisterPage } from './RegisterPage'
```

Admin has nested barrels because it has enough pages to justify one more level of grouping:

```ts
// apps/web/src/pages/admin/index.ts
export { AdminOverviewPage } from './AdminOverviewPage'
export * from './rooms'
export * from './users'
export * from './creators'
export * from './payments'
export * from './wallets'
export * from './private-sessions'
export * from './media'
export * from './reports'
```

Top-level `pages/index.ts` becomes the public import surface for route components:

```ts
export * from './auth'
export * from './rooms'
export * from './creator'
export * from './tips'
export * from './private-sessions'
export * from './payments'
export * from './wallet'
export * from './media'
export * from './reports'
export * from './livekit'
export * from './admin'
```

After migration, `App.tsx` should import pages from `@/pages`:

```ts
import {
  LoginPage,
  RegisterPage,
  RoomsPage,
  RoomPage,
  AdminOverviewPage,
} from '@/pages'
```

## Migration Steps

1. Create the target domain folders under `apps/web/src/pages`.
2. Move the existing page files into their target folders without renaming components.
3. Add one `index.ts` barrel file per domain folder.
4. Add nested admin barrel files for each admin subdomain.
5. Add root `apps/web/src/pages/index.ts`.
6. Update `apps/web/src/App.tsx` to import route components from `@/pages`.
7. Search for stale imports with:

```sh
rg "@/pages/" apps/web/src
```

8. Replace any remaining direct page imports with either `@/pages` or a clearly justified domain-local import.
9. Run type checking after dependencies are available:

```sh
pnpm typecheck
```

## Import Convention

Use `@/pages` for route composition files such as `App.tsx`.

Use local relative imports inside a domain folder only when a page is intentionally sharing a small page-local helper. If that helper becomes shared across domains, move it out of `pages`.

Avoid imports like this after migration:

```ts
import { LoginPage } from '@/pages/LoginPage'
import { AdminRoomsPage } from '@/pages/AdminRoomsPage'
```

Prefer:

```ts
import { LoginPage, AdminRoomsPage } from '@/pages'
```

## Suggested File Moves

| Source | Target |
|---|---|
| `LoginPage.tsx` | `auth/LoginPage.tsx` |
| `RegisterPage.tsx` | `auth/RegisterPage.tsx` |
| `RoomsPage.tsx` | `rooms/RoomsPage.tsx` |
| `RoomPage.tsx` | `rooms/RoomPage.tsx` |
| `RoomMessagesPage.tsx` | `rooms/RoomMessagesPage.tsx` |
| `RoomMenuPage.tsx` | `rooms/RoomMenuPage.tsx` |
| `RoomModerationPage.tsx` | `rooms/RoomModerationPage.tsx` |
| `PrepareRoomPage.tsx` | `rooms/PrepareRoomPage.tsx` |
| `GoLivePage.tsx` | `rooms/GoLivePage.tsx` |
| `EndRoomPage.tsx` | `rooms/EndRoomPage.tsx` |
| `CaptureRoomThumbnailPage.tsx` | `rooms/CaptureRoomThumbnailPage.tsx` |
| `CreatorProfilePage.tsx` | `creator/CreatorProfilePage.tsx` |
| `UpdateCreatorProfilePage.tsx` | `creator/UpdateCreatorProfilePage.tsx` |
| `CreatorMenuItemsPage.tsx` | `creator/CreatorMenuItemsPage.tsx` |
| `CreateCreatorMenuItemPage.tsx` | `creator/CreateCreatorMenuItemPage.tsx` |
| `UpdateCreatorMenuItemPage.tsx` | `creator/UpdateCreatorMenuItemPage.tsx` |
| `CreatorEarningsPage.tsx` | `creator/CreatorEarningsPage.tsx` |
| `CreateTipPage.tsx` | `tips/CreateTipPage.tsx` |
| `AcknowledgeTipPage.tsx` | `tips/AcknowledgeTipPage.tsx` |
| `CompleteTipPage.tsx` | `tips/CompleteTipPage.tsx` |
| `RequestPrivateSessionPage.tsx` | `private-sessions/RequestPrivateSessionPage.tsx` |
| `AcceptPrivateSessionPage.tsx` | `private-sessions/AcceptPrivateSessionPage.tsx` |
| `DeclinePrivateSessionPage.tsx` | `private-sessions/DeclinePrivateSessionPage.tsx` |
| `StartPrivateSessionPage.tsx` | `private-sessions/StartPrivateSessionPage.tsx` |
| `EndPrivateSessionPage.tsx` | `private-sessions/EndPrivateSessionPage.tsx` |
| `TokenPacksPage.tsx` | `payments/TokenPacksPage.tsx` |
| `CreateCcbillCheckoutPage.tsx` | `payments/CreateCcbillCheckoutPage.tsx` |
| `HandleCcbillWebhookPage.tsx` | `payments/HandleCcbillWebhookPage.tsx` |
| `WalletPage.tsx` | `wallet/WalletPage.tsx` |
| `UploadMediaPage.tsx` | `media/UploadMediaPage.tsx` |
| `CreateReportPage.tsx` | `reports/CreateReportPage.tsx` |
| `GetLivekitTokenPage.tsx` | `livekit/GetLivekitTokenPage.tsx` |
| `AdminOverviewPage.tsx` | `admin/AdminOverviewPage.tsx` |
| `AdminRoomsPage.tsx` | `admin/rooms/AdminRoomsPage.tsx` |
| `AdminRoomPage.tsx` | `admin/rooms/AdminRoomPage.tsx` |
| `AdminEndRoomPage.tsx` | `admin/rooms/AdminEndRoomPage.tsx` |
| `AdminHideRoomPage.tsx` | `admin/rooms/AdminHideRoomPage.tsx` |
| `AdminUsersPage.tsx` | `admin/users/AdminUsersPage.tsx` |
| `AdminUserPage.tsx` | `admin/users/AdminUserPage.tsx` |
| `AdminSuspendUserPage.tsx` | `admin/users/AdminSuspendUserPage.tsx` |
| `AdminRestoreUserPage.tsx` | `admin/users/AdminRestoreUserPage.tsx` |
| `AdminCreatorsPage.tsx` | `admin/creators/AdminCreatorsPage.tsx` |
| `AdminApproveCreatorPage.tsx` | `admin/creators/AdminApproveCreatorPage.tsx` |
| `AdminSuspendCreatorPage.tsx` | `admin/creators/AdminSuspendCreatorPage.tsx` |
| `AdminPaymentsPage.tsx` | `admin/payments/AdminPaymentsPage.tsx` |
| `AdminPaymentPage.tsx` | `admin/payments/AdminPaymentPage.tsx` |
| `AdminWalletPage.tsx` | `admin/wallets/AdminWalletPage.tsx` |
| `AdminAdjustWalletPage.tsx` | `admin/wallets/AdminAdjustWalletPage.tsx` |
| `AdminPrivateSessionsPage.tsx` | `admin/private-sessions/AdminPrivateSessionsPage.tsx` |
| `AdminForceEndPrivateSessionPage.tsx` | `admin/private-sessions/AdminForceEndPrivateSessionPage.tsx` |
| `AdminMediaPage.tsx` | `admin/media/AdminMediaPage.tsx` |
| `AdminApproveMediaPage.tsx` | `admin/media/AdminApproveMediaPage.tsx` |
| `AdminHideMediaPage.tsx` | `admin/media/AdminHideMediaPage.tsx` |
| `AdminReportsPage.tsx` | `admin/reports/AdminReportsPage.tsx` |
| `AdminReviewReportPage.tsx` | `admin/reports/AdminReviewReportPage.tsx` |

## Validation Checklist

- [ ] `apps/web/src/pages` no longer contains route page files directly, except `index.ts`.
- [ ] Every domain folder has an `index.ts` barrel file.
- [ ] Every nested admin folder has an `index.ts` barrel file.
- [ ] `apps/web/src/App.tsx` imports pages from `@/pages`.
- [ ] `rg "@/pages/" apps/web/src` shows no stale direct imports.
- [ ] `pnpm typecheck` passes.

## Later Cleanup

After the migration lands, consider extracting route definitions from `App.tsx` into a dedicated routing module if route count keeps growing. The folder migration does not need that refactor to be useful, so it should remain a separate follow-up.
