# Compliance & Moderation Outline

## MVP stance

The MVP is low-retention and operations-first:
- No stream recording.
- No raw stream storage.
- Manual creator thumbnails only.
- Chat/payment/session/admin logs retained.
- Admins can intervene in rooms and wallets.

## Needed policies before public real-money launch

- Terms of Service.
- Privacy Policy.
- Refund Policy.
- Token Purchase Terms.
- Creator Agreement.
- Community Guidelines.
- Prohibited Content Policy.
- DMCA/contact process if applicable.
- Report/abuse process.
- Age verification policy.
- Creator KYC/consent policy.

## Moderation tools

MVP:
- Report room/user/message.
- Delete chat message.
- Mute/kick user.
- Suspend user.
- Suspend creator.
- End room.
- Hide thumbnail/media.
- Force end private session.

Future:
- Automated media scanning.
- AI moderation assistant.
- Keyword filters.
- Trusted moderator role.
- Escalation workflows.

## Retention proposal

- Payment/ledger/admin records: retained long-term.
- Chat logs: retained for moderation/dispute period.
- Room/session metadata: retained.
- Media assets: retained until removed or account deleted, subject to policy.
- Video streams: not retained in MVP.

## Chargeback/dispute readiness

Keep:
- PaymentTransaction.
- LedgerEntry.
- Chat events.
- Tip/private session records.
- Room/session timestamps.
- IP/device/session metadata if legally acceptable and disclosed.

## Safety notes

- Private-session frames cannot become public thumbnails.
- Creators must know what public thumbnail is active.
- Admin access to sensitive data must be logged.
- Payouts should remain manual/review-only in POC.
