# Stream Architecture Breakdown

## Purpose

StreamYolo uses an approved split-stream architecture:

- LiveKit carries media streams: camera, microphone, and approved screen share.
- Socket.IO carries room product events: chat, viewer count, tips, private-session queue, moderation, and room lifecycle notifications.
- MySQL remains the source of truth for rooms, private sessions, wallets, ledger entries, chat, and admin actions.

This keeps media delivery isolated from monetization and operational state. LiveKit rooms can be created or deleted as ephemeral video spaces, while the application database controls whether a creator is live, who can join, how tokens move, and what state must survive reconnects.

Terminology matters: the durable product object is a `Room`. Paid 1:1 access is a `PrivateSession`, not a "private room." If the product later needs invite-only rooms, those should use room visibility language such as `UNLISTED` or "invite-only room" and stay separate from paid Private Sessions.

## Current Stream Types

### Public Room Stream

A public room stream is the main broadcast experience.

- Backing model: `Room`
- LiveKit room name: `Room.livekitRoomName`
- Application state: `Room.status`, `Room.startedAt`, `Room.endedAt`, `CreatorProfile.isLive`, `CreatorProfile.currentRoomId`
- Socket channel: `room:{roomId}`
- Publisher: the room creator only
- Subscribers: viewers who are allowed to access the room

The backend grants LiveKit publish rights only when the authenticated user is the creator who owns the room. Viewers receive subscribe-only tokens.

### Private Session Stream

A private session stream is a temporary, paid LiveKit media space derived from a public room.

- Backing model: `PrivateSession`
- Parent public room: `PrivateSession.publicRoomId`
- LiveKit room name: `PrivateSession.livekitRoomName`
- Application state: `REQUESTED -> ACCEPTED -> ACTIVE -> ENDED | DECLINED | EXPIRED | FORCE_ENDED`
- Socket notification target: currently intended to use `user:{userId}` for direct viewer notifications and `room:{roomId}` for creator queue updates
- Publishers: creator and viewer can both publish
- Subscribers: creator and viewer

Private sessions snapshot creator pricing and rules at request time:

- `rateTokensPerMinute`
- `minMinutes`
- `viewerCamRequired`
- `screenShareAllowed`
- `rulesText`

This protects the viewer from rule or price changes after they commit tokens.

## High-Level Topology

```txt
Browser
  LiveKit client SDK
  Socket.IO client
  REST SDK hooks
      |
      | HTTPS / WebSocket
      v
Fastify API + Socket.IO
  RoomService
  PrivateSessionService
  LiveKitService
  TipService / Wallet services
      |
      +--> MySQL
      |     Rooms
      |     PrivateSessions
      |     Wallets / Ledger
      |     Chat / Tips / Moderation
      |
      +--> LiveKit Cloud
            public room media rooms
            private session media spaces
```

## Public Room Lifecycle

### Prepare

`RoomService.prepare` creates a draft room with a generated LiveKit room name. The room exists in MySQL before any media room needs to exist in LiveKit.

The server-side go-live gate checks:

- room has a thumbnail
- room has a title
- room has category and country
- creator status is `ACTIVE`
- creator private rules/rate are usable
- creator has at least one active tip menu item

### Go Live

`RoomService.goLive` performs an atomic creator claim:

```txt
UPDATE CreatorProfile
WHERE id = creatorId AND isLive = false
SET isLive = true, currentRoomId = roomId
```

That is the main single-public-stream guard. It allows many creators to be live globally, but only one active public room per creator.

After the claim:

- the room is marked `LIVE`
- the handler asks LiveKit to create the room
- the creator receives a LiveKit token with `canPublish: true`
- `room:started` is emitted to `room:{roomId}`

### Join Public Stream

Viewers request a token through `/livekit/token` with:

```json
{
  "appRoomType": "PUBLIC_ROOM",
  "appRoomId": "roomId"
}
```

`LiveKitService.getToken` verifies the room exists, checks creator bans for non-creator viewers, and returns:

- `livekitUrl`
- `token`
- `roomName`

For public rooms:

- creator: `canPublish: true`, `canSubscribe: true`
- viewer: `canPublish: false`, `canSubscribe: true`

The room page joins Socket.IO channel `room:{roomId}` separately for chat, count, tips, and moderation events.

### End Public Stream

`RoomService.endRoom` closes related private-session activity before ending the public room:

- active private sessions are ended and metered
- requested or accepted private sessions are declined and released
- room status becomes `ENDED`
- creator `isLive` and `currentRoomId` are cleared
- LiveKit public room is deleted
- `room:ended` is emitted to `room:{roomId}`

Admin force-end follows the same product intent and emits `room:ended` with an admin reason.

## Private Session Lifecycle

### Request

A viewer requests private access from a live public room. `PrivateSessionService.request` enforces:

- parent room exists and is `LIVE`
- viewer is not banned by the creator
- viewer has no other `REQUESTED`, `ACCEPTED`, or `ACTIVE` private session
- viewer has enough tokens for the configured minimum

The service computes affordable duration up to the current cap of 30 minutes, moves tokens from available balance to reserved balance, creates a `PRIVATE_SESSION_HOLD` ledger entry, and creates a `PrivateSession` in `REQUESTED`.

The handler emits:

- `private:request_created` to `room:{roomId}`
- `wallet:update` to `user:{viewerId}`

### Accept And Start

The creator accepts the request, then starts it.

`accept` changes state:

```txt
REQUESTED -> ACCEPTED
```

`start` changes state:

```txt
ACCEPTED -> ACTIVE
```

On start:

- a new LiveKit room name is generated as `private-{nanoid}`
- LiveKit media space is created
- `startedAt` is set
- `hardEndAt` is calculated from reserved tokens and rate
- creator or viewer receives a private LiveKit token

For private sessions, both creator and viewer can subscribe. Publish grants are source-limited from the captured session rules:

- creator can publish camera and microphone
- viewer can publish microphone
- viewer can publish camera only when `viewerCamRequired` is true
- creator/viewer can publish screen share only when `screenShareAllowed` is true

### Current Public-To-Private Behavior

The creator studio switches the creator's active `LiveKitRoom` credentials from the public room stream to the Private Session media space when a Private Session starts. The public `Room` remains `LIVE` in the database, and the creator keeps the public Socket.IO room connection open for chat/private queue events.

This is intentional MVP behavior:

- public room remains the business container
- Private Session replaces public media while active
- private session becomes the creator's active media space
- public viewers stay in the public app room
- public viewers see "Creator is in a private session"
- public chat and room events can continue

Public and private media do not run side by side in MVP.

### End Private Session

Ending a private session meters elapsed time:

- elapsed minutes are rounded up
- minimum minutes are enforced
- tokens due are capped by reserved tokens
- unused reserved tokens are released
- creator earnings are credited
- ledger entries are appended
- LiveKit Private Session media space is deleted
- `private:session_ended` and `wallet:update` are emitted to the viewer

The server also runs a periodic cleanup job:

- stale requested sessions are expired and released
- active sessions past `hardEndAt` are force-ended and fully captured

## Socket.IO Strategy

Socket.IO is the application realtime layer, not the media layer.

Current room events:

- `room:join`
- `room:leave`
- `room:viewer_count`
- `room:started`
- `room:ended`
- `chat:send`
- `chat:message`
- `tip:created`
- `tip:updated`
- `goal:updated`
- `private:request_created`
- moderation events such as mute, kick, ban, pin, delete

The server currently joins sockets to `room:{roomId}` after auth and moderation checks. Viewer count is persisted on `Room.viewerCount` and incremented/decremented on socket join/leave/disconnect.

### Direct User Events

Several handlers emit to `user:{userId}`:

- `wallet:update`
- `private:request_accepted`
- `private:request_declined`
- `private:session_started`
- `private:session_ended`

Authenticated sockets join their direct user channel during `connection`:

```ts
socket.join(`user:${socket.data.userId}`)
```

## Multi-Stream Rules

### What Is Supported Now

- Many creators can be live at the same time.
- Each creator can have only one active public room, enforced through `CreatorProfile.isLive`.
- A public room can have many viewers subscribing to one creator's media stream.
- A public room can have a queue of private-session requests.
- A creator can accept a Private Session while the public room remains live as the parent product room.
- A Private Session uses a separate LiveKit media space so private media does not leak into public media.
- Private Session media pauses/replaces public media for MVP.
- Public room responses expose derived `activePrivateSessionId` so viewers can render an explicit active-private state.

### What Is Not Fully Supported Yet

- Simultaneous public broadcasting while the creator is in private; this is intentionally out of MVP.
- Multiple concurrent private sessions for one creator.
- Durable cross-process Socket.IO state.
- Accurate viewer counts across multiple tabs, reconnect races, or multiple server instances.
- LiveKit webhooks for participant join/leave or room lifecycle reconciliation.

## Scaling And Deployment Implications

The current Socket.IO setup is process-local. This is fine for one server process, but multiple server instances need shared realtime state.

Before horizontal scaling:

- add a Redis adapter for Socket.IO
- move viewer count to a presence model that can tolerate reconnects and multiple tabs
- make private-session cleanup idempotent across workers
- add LiveKit webhook reconciliation for media-space and participant lifecycle events

LiveKit itself can handle media scaling. The application scaling risk is mainly Socket.IO fanout, wallet/session consistency, and presence accuracy.

## Reliability Notes

### Database First

Money and lifecycle changes are database-first. Token holds, captures, releases, tips, and ledger entries are not driven by WebSocket events or LiveKit callbacks.

### Provider Side Effects

LiveKit room creation/deletion is an external side effect and cannot be part of the MySQL transaction.

Current examples:

- public go-live marks the room live, then creates/uses LiveKit credentials
- private start creates a LiveKit media space before updating the session to active, then deletes the media space if the DB update fails
- room end and private end delete LiveKit media spaces after DB state changes

This is workable for MVP, but production hardening should add reconciliation for orphaned LiveKit media spaces and app rooms marked live without healthy media.

### Metering

Private-session billing is based on server timestamps, not LiveKit media duration. This is good for consistency, but participant disconnect behavior should be specified. Today, a disconnected private session can continue until explicitly ended or auto-closed at `hardEndAt`.

## Recommended Next Changes

1. Add LiveKit webhook reconciliation for media space ended, participant disconnected, and media space empty events. Do not use these webhooks for billing.
2. Replace persisted `viewerCount` increments with presence records or Redis-backed counts before multi-instance deployment.
3. Make room/private cleanup jobs safe for multiple workers with ownership locks or idempotent update conditions.
4. Consider a persisted `Room.activePrivateSessionId` only if the derived state becomes too expensive or awkward to query.

## Summary

The approved MVP rule is: public room is the durable container; Private Session is isolated paid media; private media pauses/replaces public media; LiveKit owns media, Socket.IO owns room events, and MySQL owns money/session truth.
