# Design System / Style Guide

## Color direction

Use mostly neutral dark surfaces and white text.

```txt
Background: near black
Panel: charcoal
Overlay: rgba black
Text: off-white
Muted text: gray
Primary action: white or restrained violet
Live: red
Token: muted gold
Danger: red
Success: green
```

## Typography

- UI font: Inter or Geist Sans.
- Mono font: JetBrains Mono for token counters, timers, and session rates.
- Headings should not be oversized inside rooms.

## Spacing

- Room pages: edge-to-edge video with minimal padding.
- Utility panels: compact but readable.
- Admin pages: dense tables with consistent row height.

## Components

### Floating control

- Small icon or short label.
- White text.
- Dark translucent background.
- Rounded pill or rounded square.
- Visible on hover/tap/focus.

### Primary button

Used for:
- Go Live
- Buy Tokens
- Request Private
- Send Tip
- Accept Private

### Status chip

Used for:
- LIVE
- PRIVATE
- TOKENS
- VIEWERS
- PENDING

### Room card

- Thumbnail dominates.
- Minimal overlay: live status, viewer count, creator, title.
- No heavy border.

### Chat event

Different event types have subtle visual variants:
- User message.
- Creator message.
- Tip event.
- Menu request.
- Auto message.
- Private request.

## Motion

- Controls fade in/out.
- Tip events can animate subtly.
- No heavy ornamental motion.
- Respect reduced motion settings.

## Accessibility

- Controls remain visible while focused.
- Do not fade open menus/forms.
- Chat input must be keyboard usable.
- Use clear focus rings.
- Maintain contrast over video.
