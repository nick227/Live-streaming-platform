# Feature List & Prioritization

## MVP / POC

### Core product

- User auth: viewer, creator, admin.
- Creator profile with avatar/logo.
- Room setup checklist.
- Required room thumbnail before go-live.
- Manual captured thumbnail from creator preview.
- Uploaded room cover fallback.
- Public live room page.
- LiveKit camera/mic/screen share.
- Socket.IO room chat.
- Tip buttons and custom tips.
- Creator menu items with token prices.
- Tip specific menu item.
- Chat tip events.
- Creator acknowledge/complete tip request.
- Room goal.
- Auto-messages: welcome, menu reminder, private availability, quiet-room prompt.
- Private session request/accept/decline.
- Private LiveKit room.
- Private session timer and token metering.
- Token wallet and ledger.
- CCBill token-pack checkout.
- CCBill webhook handling.
- Admin overview.
- Admin live room controls.
- User/creator management.
- Payment and wallet admin.
- Media review/hide.

## Phase 2

- Auto snapshots as optional feature.
- More advanced moderation queue.
- Polls.
- Top supporters/leaderboard.
- Viewer badges.
- Tip goal history.
- Creator analytics.
- Admin exports.
- Manual payout workflow.
- Creator onboarding/KYC workflow.
- Creator scenes/layout presets.
- Scheduled rooms.
- Notifications.

## Phase 3

- Fan clubs/subscriptions.
- Paid DMs.
- Clip/content store.
- Recording for flagged sessions or opt-in content.
- Advanced room discovery.
- VIP lists.
- Private queue bidding.
- Loyalty points.
- AI moderation assistant.
- Multi-provider video abstraction.
- Self-hosted LiveKit fallback.
- Native apps or PWA push.

## Explicitly deferred

- Full automated payouts.
- Full video archive.
- Automatic stream snapshots in MVP.
- Complex ranking/search.
- Multi-region scaling.
- App store distribution.

## MVP prioritization matrix

| Feature | Priority | Reason |
|---|---:|---|
| Creator Studio setup checklist | P0 | Prevents bad rooms and incomplete monetization setup |
| LiveKit public room | P0 | Core product proof |
| Socket.IO chat | P0 | Critical participation surface |
| Token wallet/ledger | P0 | Required for monetization correctness |
| CCBill token packs | P0 | Real-money POC requirement |
| Tip menu | P0 | Differentiating monetization mechanic |
| Private sessions | P0 | Core monetization loop |
| Admin payments/wallets | P0 | Required for real-money operations |
| Media review/hide | P1 | Needed for thumbnail control and safety |
| Auto messages | P1 | Makes rooms feel alive |
| Room goals | P1 | High-impact engagement feature |
| Auto snapshots | Deferred | Useful later but riskier than manual thumbnail |
