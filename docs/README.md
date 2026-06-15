# StreamYolo Research & Planning Package

This package captures the product, technical, design, and operational decisions for the StreamYolo day-one proof of concept.

## Core decision snapshot

- Product: chromeless live room platform focused on public rooms, chat, tipping, paid private sessions, and creator control.
- Name/domain direction: StreamYolo / streamyolo.com as working POC brand.
- MVP stack: Railway + Node/Fastify + MySQL + Socket.IO + LiveKit Cloud + CCBill token-pack checkout.
- Video: LiveKit Cloud for rooms, screen sharing, private sessions. Do not self-host video for POC.
- Payments: CCBill token-pack purchases; internal token wallet and ledger for tips/private sessions.
- Recording: no stream recording in MVP. Keep metadata, chat, room events, payment and token ledger.
- Thumbnails: no auto snapshots in MVP. Creator must choose/upload/capture a room thumbnail before going live.
- Design: neutral, chromeless, room-first. Brand appears only in masthead, primary buttons, token controls, and sparse system moments.
- Creator Studio: flagship surface with room setup checklist, live controls, private rules, tip menu, current thumbnail, chat, earnings, private queue.
- Admin: operations command center for rooms, users, creators, payments, wallets, media review, moderation, and reports.

## Document index

### Product
- `01-product/prd-scope.md`
- `01-product/personas-target-audience.md`
- `01-product/feature-prioritization.md`
- `01-product/risk-open-questions.md`
- `01-product/timeline-milestones.md`

### IA and flows
- `02-ia-flows/site-map.md`
- `02-ia-flows/user-flows.md`

### Technical
- `03-technical/architecture-overview.md`
- `03-technical/tech-stack-dependency-rationale.md`
- `03-technical/technical-requirements.md`
- `03-technical/data-model-schema-outline.md`
- `03-technical/database-migrations-guide.md`
- `03-technical/api-contract.md`
- `03-technical/shared-types.ts`
- `03-technical/auth-permissions-roles.md`
- `03-technical/integrations-dependencies.md`
- `03-technical/non-functional-requirements.md`

### Engineering handoff
- `04-engineering/repository-structure.md`
- `04-engineering/coding-standards-style-guide.md`
- `04-engineering/naming-conventions.md`
- `04-engineering/environment-setup-local-dev.md`
- `04-engineering/deployment-plan.md`
- `04-engineering/testing-qa-acceptance.md`

### Design
- `05-design/design-brief-brand-style-guide.md`
- `05-design/design-system-style-guide.md`
- `05-design/design-tokens.md`
- `05-design/component-library-ui-kit.md`
- `05-design/wireframes-ui-specs.md`
- `05-design/brand-guidelines.md`
- `05-design/content-inventory.md`

### Operations
- `06-operations/admin-operations-spec.md`
- `06-operations/compliance-moderation-outline.md`

### Deployment
- `architecture.md` — system overview
- `setup.md` — local dev setup
- `deployment.md` — general deployment reference
- `railway.md` — Railway go-live guide (step-by-step)

## Recommended next step

Turn this package into an implementation backlog by creating tickets for: auth shell, creator studio setup checklist, LiveKit room token issuance, Socket.IO room chat, wallet/ledger, CCBill checkout/webhooks, private-session flow, and admin operations views.
