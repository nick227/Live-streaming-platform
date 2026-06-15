# Product Requirements Document / Scope

## Product name

StreamYolo

## Product summary

StreamYolo is a room-first live creator platform where creators host public rooms, viewers participate through chat and token tips, and paid private sessions can be requested and managed in real time. The platform should feel chromeless and neutral; the creator's room, thumbnail, video, chat, and monetization controls are the focus.

## Primary goals

1. Prove a live room can be created, joined, monetized, and managed.
2. Prove real-money token-pack purchases through CCBill.
3. Prove internal token ledger mechanics for tips and private sessions.
4. Prove public room chat, creator menu requests, and private request flow.
5. Prove a strong creator studio experience with room setup, thumbnail selection, live controls, tip menu, private rules, and private queue.
6. Provide enough admin control to operate a small real-money POC safely.

## Non-goals for MVP

- No stream recording.
- No raw video archive.
- No creator automated payout system.
- No subscriptions/fan club.
- No paid DMs.
- No clip store.
- No self-hosted LiveKit infrastructure.
- No auto stream snapshots.
- No complex recommendation ranking.
- No native mobile apps.

## Target POC usage

- 10–100 expected users in first 90 days.
- Small number of approved creators.
- Manual/admin-assisted operations are acceptable.
- Real money is accepted only through token-pack purchases.
- Creator payouts are manual/review-only during POC.

## MVP success criteria

- Creator can complete room setup and go live.
- Room cannot go live without thumbnail, title, private rate/rules, and a basic tip menu.
- Viewer can join a live public room and chat.
- Viewer can buy token pack through CCBill and wallet is credited via webhook.
- Viewer can tip generic/custom amount or tip a specific creator menu item.
- Tip creates visible chat event and ledger entries.
- Viewer can request private session.
- Creator can accept/decline private session.
- Private LiveKit room is created and joined by creator/viewer.
- Session meter reserves/captures/releases tokens.
- Admin can see live rooms, users, creators, payments, wallets, private sessions, media, and reports.

## Scope summary

### Viewer scope

- Browse live rooms.
- View creator profile.
- Enter public room.
- Chat.
- Buy token packs.
- View wallet/ledger.
- Tip from quick buttons, custom amount, or creator menu.
- Request private session.

### Creator scope

- Manage profile avatar/logo.
- Configure room title and thumbnail.
- Configure private rules and rate.
- Configure tip menu.
- Start/end public room.
- Manage camera/mic/screen share via LiveKit.
- Monitor chat/tips/private requests.
- Accept/decline private sessions.
- View earnings.

### Admin scope

- Daily operations overview.
- Live room monitoring and emergency controls.
- User/creator suspension.
- Media review/hide.
- Payment transaction inspection.
- Wallet ledger inspection and adjustments.
- Private session monitoring and force-end.
- Reports/moderation queue.

## Product principles

- The room is the brand.
- The stream is the interface.
- The platform disappears.
- Every UI element should help the viewer participate, the creator control the room, or the admin operate the site.
- Money and moderation events are permanent; live video is ephemeral.
