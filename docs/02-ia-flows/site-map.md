# Site Map / Information Architecture

## Public

```txt
/
  Browse live rooms
  Featured creators
  Login / signup
  Buy tokens CTA if authenticated

/creator/:username
  Creator profile
  Live/offline status
  Room entry
  Private rate preview

/room/:roomSlug
  Public live room
  Video
  Chat
  Tip/menu/private controls
```

## Auth

```txt
/login
/signup
/logout
/forgot-password later
```

## Viewer

```txt
/dashboard
  Balance
  Recent activity
  Recent rooms

/tokens
  Token packs
  Checkout start

/payment/success
/payment/failed

/wallet
  Balance
  Ledger
  Purchases
  Tips
  Private session charges

/private/:sessionId
  Paid private session room
```

## Creator

```txt
/creator/studio
  Room setup checklist
  Current thumbnail
  Go live controls
  Live preview
  Chat
  Tip feed
  Room goal
  Private queue
  Earnings pulse

/creator/earnings
  Pending earnings
  Tips
  Private earnings
  Estimated payout

/creator/profile
  Avatar/logo
  Bio
  Display/stage name

/creator/settings
  Private defaults
  Tip menu defaults
  Auto messages
```

For MVP, creator pages may be tabs inside `/creator/studio`.

## Admin

```txt
/admin
  Operations overview

/admin/rooms
/admin/rooms/:id
  Live rooms, room detail, emergency controls

/admin/users
/admin/users/:id

/admin/creators
/admin/creators/:id

/admin/payments
/admin/payments/:id

/admin/wallets
/admin/wallets/:userId

/admin/private-sessions
/admin/private-sessions/:id

/admin/media-review

/admin/reports

/admin/settings
```

## Navigation principles

- Public room is immersive and chromeless.
- Creator studio is a cockpit, but still neutral and restrained.
- Admin is utility-first with dense tables, filters, and detail drawers.
- Wallet/payment screens are trust-first and clear.
