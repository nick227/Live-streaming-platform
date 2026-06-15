# Testing & QA Plan / Acceptance Criteria

## Test categories

### Unit tests

- Wallet debit/credit.
- Ledger entry creation.
- Insufficient funds.
- Private hold/capture/release.
- Go-live eligibility.
- CCBill webhook idempotency.
- Permission checks.

### Integration tests

- Auth/session.
- Room creation and go-live.
- LiveKit token endpoint.
- Tip transaction.
- Payment approval webhook.
- Private session lifecycle.
- Admin wallet adjustment.

### E2E tests

- Creator prepares room and goes live.
- Viewer joins room and chats.
- Viewer buys tokens through simulated provider.
- Viewer tips menu item.
- Viewer requests private; creator accepts; session ends.
- Admin ends a room.

## Critical acceptance criteria

### Go live

- Cannot go live without thumbnail.
- Cannot go live without room title.
- Cannot go live without private rules/rate/min duration.
- Cannot go live without minimum tip menu.

### Wallet

- Tip cannot exceed available token balance.
- Ledger records exact token movement.
- Balance after is correct.
- Duplicate payment webhooks do not double-credit.
- Admin adjustment appends ledger entry.

### Private session

- Request requires enough balance for minimum session.
- Tokens are reserved on accept/start.
- Captures occur according to timer rules.
- Unused reserved tokens are released.
- Admin can force end.

### Chat

- Messages persist.
- Tip events appear in chat.
- Creator messages are visually distinct.
- Muted/suspended users cannot chat.

### Admin

- Admin can view live rooms.
- Admin can end room.
- Admin can suspend user/creator.
- Admin can inspect payments and ledger.

## Manual QA smoke script

1. Create viewer and creator.
2. Creator uploads/captures thumbnail.
3. Creator creates menu and private rules.
4. Creator goes live.
5. Viewer joins and chats.
6. Viewer buys token pack using demo/CCBill sandbox.
7. Viewer tips menu item.
8. Creator acknowledges tip.
9. Viewer requests private.
10. Creator accepts.
11. Session runs and ends.
12. Admin verifies ledger and room logs.
