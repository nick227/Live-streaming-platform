# Component Library / UI Kit Documentation

## Core primitives

### Button

Variants:
- primary
- secondary
- ghost
- danger
- token

### IconButton

Used for floating room controls.

### FloatingControl

Small control floating over video/thumbnail.

Props:
```ts
label?: string
icon: ReactNode
active?: boolean
intent?: 'neutral' | 'live' | 'token' | 'danger'
```

### StatusChip

Used for LIVE, PRIVATE, viewer count, token balance.

### Drawer

Used for chat, tip menu, private queue, wallet preview.

### Modal

Used for confirmations: buy tokens, send tip, request private.

## Room components

- RoomSurface
- RoomTopOverlay
- RoomBottomControls
- RoomChatRail
- TipMenuPanel
- RoomGoalCard
- PrivateRequestModal
- TokenBalanceChip
- RoomCard

## Creator Studio components

- CreatorStudioShell
- GoLiveChecklist
- ThumbnailPanel
- LivePreviewPanel
- BroadcastControls
- CreatorChatPanel
- TipFeed
- TipMenuBuilder
- PrivateRulesForm
- PrivateQueue
- EarningsPulse

## Admin components

- AdminShell
- AdminMetricCard
- DataTable
- StatusFilter
- DetailDrawer
- AdminActionBar
- LedgerEntryRow
- PaymentStatusChip
- RoomEventTimeline

## Rendering principles

- Room UI floats over media and fades.
- Creator Studio uses panels but remains quiet.
- Admin uses dense utility components.
- Tokens always use consistent icon/format.
