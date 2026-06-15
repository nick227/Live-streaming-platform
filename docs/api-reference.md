# API Reference

> Generated from `packages/api-spec/openapi.yaml`. Do not edit by hand.

## Auth

| Endpoint | Description | Auth | Success |
|---|---|---|---|
| `POST /auth/register` | Register a new account | Public | `201` |
| `POST /auth/login` | Login with email and password | Public | `200` |
| `POST /auth/logout` | Logout and clear session | Auth required | `200` |
| `GET /auth/me` | Get the current authenticated user | Auth required | `200` |

## Rooms

| Endpoint | Description | Auth | Success |
|---|---|---|---|
| `GET /rooms` | List live public rooms | Public | `200` |
| `GET /rooms/{slug}` | Get a room by slug | Public | `200` |

## Creator-rooms

| Endpoint | Description | Auth | Success |
|---|---|---|---|
| `POST /creator/rooms/prepare` | Create or update the creator's draft room setup | Auth required | `200` |
| `POST /creator/rooms/{roomId}/go-live` | Go live — creator must pass eligibility check (approved status + thumbnail + tip menu + private rules) | Auth required | `200` |
| `POST /creator/rooms/{roomId}/end` | End the creator's live room | Auth required | `200` |

## Creator-profile

| Endpoint | Description | Auth | Success |
|---|---|---|---|
| `GET /creator/profile` | Get the authenticated creator's own profile | Auth required | `200` |
| `PATCH /creator/profile` | Update the authenticated creator's profile | Auth required | `200` |

## Creator-menu

| Endpoint | Description | Auth | Success |
|---|---|---|---|
| `GET /creator/menu-items` | List the creator's own menu items | Auth required | `200` |
| `POST /creator/menu-items` | Create a new creator menu item | Auth required | `201` |
| `PATCH /creator/menu-items/{menuItemId}` | Update a creator menu item | Auth required | `200` |
| `DELETE /creator/menu-items/{menuItemId}` | Delete a creator menu item | Auth required | `200` |

## Livekit

| Endpoint | Description | Auth | Success |
|---|---|---|---|
| `POST /livekit/token` | Get a LiveKit participant token for a public room or private session | Auth required | `200` |

## Chat

| Endpoint | Description | Auth | Success |
|---|---|---|---|
| `GET /rooms/{roomId}/messages` | Get recent chat history for a room | Public | `200` |

## Tips

| Endpoint | Description | Auth | Success |
|---|---|---|---|
| `GET /rooms/{roomId}/menu` | Get the tip menu and goal for a room | Public | `200` |
| `POST /rooms/{roomId}/tips` | Send a tip in a room | Auth required | `201` |
| `POST /creator/tips/{tipId}/acknowledge` | Creator acknowledges a tip | Auth required | `200` |
| `POST /creator/tips/{tipId}/complete` | Creator marks a tip request as completed | Auth required | `200` |

## Token-packs

| Endpoint | Description | Auth | Success |
|---|---|---|---|
| `GET /token-packs` | List available token packs | Public | `200` |

## Payments

| Endpoint | Description | Auth | Success |
|---|---|---|---|
| `POST /payments/ccbill/checkout` | Create a CCBill token-pack checkout session | Auth required | `200` |
| `POST /webhooks/ccbill` | CCBill payment webhook handler — idempotent, verifies signature | Public | `200` |

## Wallet

| Endpoint | Description | Auth | Success |
|---|---|---|---|
| `GET /wallet` | Get the authenticated user's wallet and recent ledger entries | Auth required | `200` |

## Private-sessions

| Endpoint | Description | Auth | Success |
|---|---|---|---|
| `POST /rooms/{roomId}/private-sessions/request` | Viewer requests a private session in a room | Auth required | `201` |
| `POST /creator/private-sessions/{sessionId}/accept` | Creator accepts a private session request | Auth required | `200` |
| `POST /creator/private-sessions/{sessionId}/decline` | Creator declines a private session request | Auth required | `200` |
| `POST /private-sessions/{sessionId}/start` | Start an accepted private session and get LiveKit credentials | Auth required | `200` |
| `POST /private-sessions/{sessionId}/end` | End an active private session — captures elapsed tokens, releases remainder | Auth required | `200` |

## Media

| Endpoint | Description | Auth | Success |
|---|---|---|---|
| `POST /media/upload` | Upload avatar, logo, banner, or room cover (multipart) | Auth required | `201` |
| `POST /rooms/{roomId}/thumbnail/capture` | Submit a browser-captured frame as the room thumbnail | Auth required | `200` |

## Creator-earnings

| Endpoint | Description | Auth | Success |
|---|---|---|---|
| `GET /creator/earnings` | Get creator's earnings summary and recent ledger entries | Auth required | `200` |

## Reports

| Endpoint | Description | Auth | Success |
|---|---|---|---|
| `POST /reports` | Submit a report on a user, room, message, or media asset | Auth required | `201` |

## Admin

| Endpoint | Description | Auth | Success |
|---|---|---|---|
| `GET /admin/overview` | Admin dashboard overview — live rooms, user counts, pending queues | Auth required | `200` |
| `GET /admin/rooms` | Admin list all rooms | Auth required | `200` |
| `GET /admin/rooms/{roomId}` | Admin get room detail | Auth required | `200` |
| `POST /admin/rooms/{roomId}/end` | Admin force-end a live room | Auth required | `200` |
| `POST /admin/rooms/{roomId}/hide` | Admin hide a room from public listing | Auth required | `200` |
| `GET /admin/users` | Admin list all users | Auth required | `200` |
| `GET /admin/users/{userId}` | Admin get user detail with wallet and creator profile | Auth required | `200` |
| `POST /admin/users/{userId}/suspend` | Admin suspend a user | Auth required | `200` |
| `POST /admin/users/{userId}/restore` | Admin restore a suspended user | Auth required | `200` |
| `GET /admin/creators` | Admin list all creator profiles | Auth required | `200` |
| `POST /admin/creators/{creatorId}/approve` | Admin approve a creator (sets status ACTIVE, enables go-live) | Auth required | `200` |
| `POST /admin/creators/{creatorId}/suspend` | Admin suspend a creator profile | Auth required | `200` |
| `GET /admin/payments` | Admin list all payment transactions | Auth required | `200` |
| `GET /admin/payments/{paymentId}` | Admin get a payment transaction with raw provider data | Auth required | `200` |
| `GET /admin/wallets/{userId}` | Admin get a user's wallet and full ledger | Auth required | `200` |
| `POST /admin/wallets/{userId}/adjust` | Admin create a manual wallet adjustment — appends ledger entry | Auth required | `200` |
| `GET /admin/private-sessions` | Admin list private sessions | Auth required | `200` |
| `POST /admin/private-sessions/{sessionId}/force-end` | Admin force-end an active private session | Auth required | `200` |
| `GET /admin/media` | Admin list media assets for review | Auth required | `200` |
| `POST /admin/media/{mediaId}/approve` | Admin approve a media asset | Auth required | `200` |
| `POST /admin/media/{mediaId}/hide` | Admin hide a media asset | Auth required | `200` |
| `GET /admin/reports` | Admin list reports queue | Auth required | `200` |
| `POST /admin/reports/{reportId}/review` | Admin review and action a report | Auth required | `200` |
