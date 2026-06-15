# Naming Conventions

## Product terms

Use:
- Room
- Creator
- Viewer
- Token
- Tip
- Private Session
- Creator Menu
- Room Goal
- Thumbnail

Avoid:
- Cam model internally where not needed.
- Performative/adult-specific labels in core data model.
- Dollar terms for internal tip/private spend; use tokens.

## IDs

Prefix conventions optional but useful:

```txt
usr_ User
crt_ CreatorProfile
room_ Room
sess_ PrivateSession
pay_ PaymentTransaction
wal_ Wallet
led_ LedgerEntry
tip_ Tip
med_ MediaAsset
```

## Routes

- Public: `/room/:roomSlug`, `/creator/:username`
- Creator: `/creator/studio`, `/creator/earnings`
- Admin: `/admin/...`
- API: `/api/...`

## Events

Socket.IO events use namespace-like names:

```txt
room:join
room:leave
room:viewer_count
chat:send
chat:message
tip:created
private:request_created
wallet:update
```

## Status enums

Use uppercase strings:

```txt
LIVE
ENDED
PENDING
APPROVED
SUSPENDED
```

## Database model names

Use singular PascalCase:

```txt
User
CreatorProfile
Room
PrivateSession
PaymentTransaction
LedgerEntry
```

## Files

- React components: `PascalCase.tsx`
- hooks: `useThing.ts`
- services: `thing.service.ts`
- routes: `thing.routes.ts`
- providers: `thing.provider.ts`
- tests: `thing.test.ts`
