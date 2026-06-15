# Tech Stack & Dependency Rationale

## Chosen stack

```txt
Frontend: React + Vite
Backend: Node.js + Fastify
Realtime: Socket.IO
Database: MySQL
ORM: Prisma
Video: LiveKit Cloud
Payments: CCBill
Hosting: Railway
Object storage: S3-compatible storage
Language: TypeScript
```

## Rationale

### React + Vite

Fast POC development, flexible UI, easy LiveKit client integration, and simple deployment.

### Node.js + Fastify

Fast APIs, TypeScript-friendly, good plugin ecosystem, familiar backend shape for real-time apps.

### Socket.IO

Best slim POC solution for app rooms, chat, tips, private queue, presence, and reconnect behavior. LiveKit handles media rooms; Socket.IO handles product rooms.

### MySQL

Strong relational model for money-like ledger, payments, sessions, users, admin actions, reports, and chat.

### Prisma

Good schema visibility, migrations, generated types, and developer velocity.

### LiveKit Cloud

Best day-one video choice: media rooms, screen sharing, WebRTC, participants, tokens. Avoids self-hosted SFU/TURN complexity.

### CCBill

Known adult/high-risk payment provider. Intended for real-money token-pack purchases. Avoid Stripe risk.

### Railway

Fast POC deployment, managed services, GitHub integration, low operational overhead.

## Future optional changes

- Replace Railway with VPS/Kubernetes only if scaling demands it.
- Add Redis when Socket.IO scaling or queues require it.
- Add self-hosted LiveKit if policy/cost requires it.
- Add background workers for payment reconciliation, cleanup, email, and reports.
