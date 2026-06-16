# Wireframes / UI Spec Descriptions

## Browse page

```txt
[Minimal masthead: StreamYolo | Rooms | Tokens | Account]

[Live Rooms Grid]
  Room Card
    thumbnail/image fills card
    overlay: LIVE, viewer count
    bottom overlay: creator name, room title

[Offline/Featured Creators]
```

## Public room page

```txt
Full viewport room surface
  live video or selected thumbnail

Top overlay:
  StreamYolo wordmark small
  creator name
  LIVE chip
  viewer count
  token balance

Right drawer:
  chat
  pinned menu/goal/private card

Bottom overlay:
  Chat
  Tip
  Menu
  Goal
  Private
  Share
```

Behavior:
- Overlays fade after inactivity.
- Chat can be pinned open.
- Controls remain visible while focused.

## Creator Studio

```txt
Top strip:
  LIVE/OFFLINE
  Room title
  Viewer count
  Room earnings
  Duration

Main left:
  Live preview
  Floating controls: mic/cam/screen/end

Main right:
  Chat + tip feed
  Private request queue

Lower/side panels:
  Current public thumbnail
  Go-live checklist
  Tip menu
  Room goal
  Private rules/rate
```

Required visible element:
- Current public thumbnail preview.

## Token purchase page

```txt
Header: Buy Tokens
Subcopy: Tokens are used for tips and private sessions.

Token pack cards:
  Starter 500 tokens $4.99
  Standard 1,100 tokens $9.99
  Popular 3,000 tokens $24.99
  Large 6,500 tokens $49.99

Wallet balance shown persistently.
```

## Private session page

```txt
Full viewport Private Session
Top overlay:
  PRIVATE
  timer
  rate
  tokens reserved / remaining

Main:
  LiveKit video

Controls:
  mic/cam/screen/end
```

## Admin overview

```txt
Top metrics:
  Live rooms
  Active viewers
  Tokens purchased today
  Tokens tipped today
  Active private sessions
  Reports open

Queues:
  Pending media
  Payment issues
  Reports

Tables:
  Live rooms
  Recent payments
  Recent admin actions
```
