# Authentication & Permissions / Roles Spec

## Roles

### VIEWER

Can:
- Browse rooms.
- Join public rooms.
- Chat unless muted/suspended.
- Buy token packs.
- Tip.
- Request private sessions.
- View own wallet/ledger.

Cannot:
- Start rooms.
- Access creator studio.
- Access admin.
- Modify other users.

### CREATOR

Can:
- All viewer actions.
- Manage creator profile.
- Upload avatar/logo and room media.
- Create/prepare room.
- Go live if checklist complete.
- Manage room chat with limited room-level moderation.
- Configure tip menu and private rules.
- Accept/decline private sessions.
- View own earnings.

Cannot:
- Adjust wallets.
- View raw payment provider data.
- Suspend users globally.
- Access admin operations pages.

### ADMIN

Can:
- View admin overview.
- Manage rooms, users, creators, payments, wallets, media, reports.
- End rooms/private sessions.
- Hide media/rooms.
- Suspend users/creators.
- Create wallet adjustments.
- View raw provider payloads.

## Object-level permissions

- Users can only view their own wallet and ledger.
- Creators can only manage their own creator profile and rooms.
- Creators can only moderate chat inside their own active room.
- Admins can inspect all operational records.

## Authentication strategy

MVP options:
- Email/password with secure session cookie.
- Magic link later.
- OAuth later.

Requirements:
- HTTP-only secure cookies in production.
- CSRF protection if using cookie sessions.
- Rate limit login/signup.
- Password hashing with Argon2 or bcrypt.

## Authorization conventions

- Backend enforces all role checks.
- Frontend route guards are UX only.
- Admin actions create AdminAction records.
- Money-related actions require fresh authenticated user.

## Account states

```txt
ACTIVE: normal use
SUSPENDED: cannot chat, tip, buy, or join private; may view limited account page
DELETED: anonymized/disabled depending on retention rules
```

## Creator states

```txt
DRAFT: creator setup incomplete
PENDING: waiting approval if approval is enabled
ACTIVE: can go live
PAUSED: creator voluntarily inactive or admin paused
SUSPENDED: cannot go live or accept private sessions
BANNED: permanently disabled
```
