# User Flow Diagrams — Textual Descriptions

## Flow 1: Creator prepares and goes live

```txt
Creator logs in
  → Opens Creator Studio
  → Completes profile avatar/logo
  → Sets room title
  → Uploads or captures room thumbnail
  → Sets private rate and minimum duration
  → Writes private rules
  → Creates at least 3 tip menu items
  → Previews public room card
  → Clicks Go Live
  → Backend creates Room
  → Backend creates LiveKit room/token
  → Creator joins LiveKit as publisher
  → Room appears in public browse
```

Acceptance notes:
- Go Live disabled until required setup is complete.
- Private-session frames are never available as public thumbnails.
- Creator always sees the current public thumbnail.

## Flow 2: Viewer joins and participates

```txt
Viewer opens browse
  → Selects live room
  → Joins public room
  → Socket joins room channel
  → LiveKit viewer token issued
  → Viewer watches video
  → Viewer chats
  → Viewer opens creator menu
  → Viewer tips a menu item
  → Wallet debited
  → Creator earnings credited
  → Chat shows tip event
  → Creator acknowledges request
```

## Flow 3: Token-pack purchase

```txt
Viewer opens /tokens
  → Chooses token pack
  → Backend creates PaymentTransaction PENDING
  → Viewer goes to CCBill checkout
  → CCBill approves purchase
  → CCBill webhook received
  → Backend verifies/idempotently processes webhook
  → PaymentTransaction APPROVED
  → Wallet credited
  → LedgerEntry TOKEN_PURCHASE created
  → Viewer sees updated balance
```

## Flow 4: Private session request

```txt
Viewer in public room
  → Clicks Request Private
  → Sees rate/minimum and estimated available time
  → Confirms request
  → Backend verifies balance
  → PrivateSession REQUESTED
  → Creator receives queue card
  → Creator accepts
  → Backend creates token hold
  → PrivateSession ACCEPTED
  → Backend creates LiveKit private room
  → Viewer and creator navigate/join
  → Session ACTIVE
  → Timer captures tokens periodically
  → Session ends
  → Remaining reserved tokens released
  → Creator earnings updated
```

## Flow 5: Admin handles active room issue

```txt
Admin opens /admin
  → Sees live rooms and reports
  → Opens room detail
  → Reviews chat/tips/private events
  → Deletes message or mutes/kicks user
  → If needed, hides room or ends room
  → AdminAction logged
```

## Flow 6: Admin handles payment issue

```txt
Admin opens payments
  → Filters FAILED / MANUAL_REVIEW / CHARGEBACK
  → Opens transaction detail
  → Reviews raw provider payload
  → Confirms wallet/ledger effects
  → Applies reversal or adjustment if needed
  → AdminAction logged
```
