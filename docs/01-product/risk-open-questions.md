# Risk Assessment & Open Questions Log

## Major risks

### Payment processor approval

CCBill is the intended day-one real-money provider, but approval, underwriting requirements, webhook shape, payout rules, prohibited content rules, and reserve/chargeback policies must be confirmed.

Mitigation:
- Apply early.
- Use token-pack purchases only.
- Keep internal wallet ledger provider-agnostic.
- Avoid direct per-tip card charges.

### Adult compliance and moderation

The business category requires age verification, creator identity/KYC, prohibited content policy, reporting, consent records, and chargeback/dispute readiness.

Mitigation:
- Require creator approval before live.
- Keep admin intervention controls.
- Log chat/events/payments.
- No video recording by default.
- Manual creator payouts initially.

### LiveKit Cloud policy fit

LiveKit is technically strong, but Cloud policy acceptance for adult live rooms must be confirmed directly.

Mitigation:
- Abstract VideoProvider.
- Keep self-hosted LiveKit as future fallback.
- Use LiveKit Cloud for POC speed only.

### Real-time reliability

Railway app plus Socket.IO needs reconnect handling and room state persistence.

Mitigation:
- Persist important state to MySQL.
- Use Socket.IO reconnection.
- Treat sockets as delivery layer, not source of truth.

### Thumbnail safety

Bad thumbnails can hurt conversion and create moderation risk.

Mitigation:
- No auto snapshots in MVP.
- Creator must select thumbnail.
- Admin can hide/remove media.
- Private-session frames are never public thumbnails.

### Wallet correctness

Money-adjacent token ledgers must be auditable.

Mitigation:
- Append-only LedgerEntry.
- Wallet balance as derived/current state.
- Idempotent payment webhook handling.
- Admin adjustments append corrections, never edit history.

## Open questions

1. What exact CCBill integration type will be available: hosted checkout, FlexForms, API tokenization, or another model?
2. What creator onboarding/KYC minimum is required before first paid live room?
3. Do we need age verification for viewers before entering rooms or before buying tokens?
4. What content rules must be displayed and accepted by creators before going live?
5. Are private sessions one-on-one only in MVP?
6. Should viewer camera be enabled in private sessions, disabled by default, or creator-configurable?
7. Should screen sharing be creator-only, viewer-only, or both?
8. What token-to-payout conversion applies after platform cut and processor fees?
9. What minimum admin coverage is needed during live operation?
10. Can LiveKit Cloud be used for the intended category? Need written confirmation.
11. What is the legal entity/payment processor account structure?
12. What reporting/abuse workflow is legally required for launch jurisdiction?
