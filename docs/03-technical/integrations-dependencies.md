# Third-Party Integrations & Dependencies List

## Required MVP integrations

### LiveKit Cloud

Purpose:
- Video rooms.
- Camera/mic tracks.
- Screen sharing.
- Public room media.
- Private session media.

Usage:
- Backend creates/ends rooms and issues tokens.
- Frontend joins with LiveKit client SDK.

Risks:
- Must confirm category/policy fit.
- Must control token grants carefully.

### CCBill

Purpose:
- Real-money token-pack checkout.
- Payment approval/decline.
- Webhook/callback status updates.

Usage:
- Viewer buys token pack.
- Backend tracks PaymentTransaction.
- Webhook credits Wallet through LedgerEntry.

Risks:
- Underwriting approval.
- Webhook integration details.
- Chargebacks/refunds.
- Compliance requirements.

### Railway

Purpose:
- App hosting.
- Backend/frontend deploys.
- Managed MySQL.
- Environment variable management.

Risks:
- WebSocket behavior/reconnect handling.
- Usage-based pricing.
- Not intended for self-hosting media SFU.

### Object storage

Purpose:
- Avatar/logo.
- Room covers.
- Captured thumbnails.

Candidates:
- Cloudflare R2.
- S3.
- Railway volume only for temporary POC, but object storage is better.

## Optional / future integrations

- Redis for Socket.IO scaling and queues.
- Email provider for magic links, receipts, account alerts.
- Age verification provider.
- Creator KYC/payout provider.
- Moderation/image scanning provider.
- Analytics/event warehouse.
- Self-hosted LiveKit/coturn.

## Internal abstractions

- `VideoProvider`
- `PaymentProvider`
- `StorageProvider`
- `EmailProvider`
- `AgeVerificationProvider` later
- `PayoutProvider` later
