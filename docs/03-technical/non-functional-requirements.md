# Non-Functional Requirements

## Performance

- Public room page should load quickly and prioritize video/thumbnail first.
- Chat/tip events should appear near-real-time.
- Token wallet updates should be visible immediately after commit.
- Browse room cards should use optimized thumbnails.
- Avoid large JS bundles where possible.

## Reliability

- Important state persists in MySQL.
- Socket reconnect must restore room state.
- LiveKit token issuance should be retryable.
- Payment webhooks must be idempotent.
- Private sessions must be force-endable by admin.

## Security

- Use HTTPS everywhere.
- Secure session cookies.
- Role-based authorization on every protected endpoint.
- Do not trust client wallet amounts.
- Validate all inputs.
- Sanitize/escape chat output.
- Rate limit auth, chat, tips, private requests, and webhooks.
- Protect webhook endpoints with provider verification.
- Store secrets only in environment variables.

## Privacy

- No stream recording in MVP.
- No private-session thumbnails.
- Avoid unnecessary retention of sensitive media.
- Admin access should be logged.

## Accessibility

- Controls must not fade while focused.
- Keyboard navigation for room controls, chat, token purchase, private request.
- Visible focus indicators.
- Sufficient contrast for text over video overlays.
- Captions not required for MVP but consider future.

## Compliance

- Age verification policy required before real launch.
- Creator approval/KYC policy required before payouts.
- Prohibited content policy required.
- Report/abuse flow required.
- Payment/chargeback handling required.
- Terms/privacy/refund policy required.

## Observability

- Structured logs for payments, wallet mutations, room lifecycle, private sessions, admin actions.
- Error tracking.
- Basic health endpoint.
- Admin operational dashboards.

## Data retention

- Retain ledger/payment/admin logs.
- Retain chat during MVP for moderation/disputes.
- No video retention.
- Media can be removed/hidden by admin.
