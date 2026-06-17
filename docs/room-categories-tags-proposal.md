# Room Categories, Tags & Country of Origin — Proposal

**Status: Approved — ready to implement**

## Goal

Add a **pre-defined taxonomy** so viewers can filter the live room browse page by:

- **Category** — exactly one per room (Entertainment, Music, Education, Business)
- **Tags** — zero or more per room, chosen from a curated list
- **Country of origin** — exactly one per room (ISO country)

Creators should **reuse the same choices across future rooms**. The first time they set category, tags, and country on a room, those values become their defaults for the next `prepareRoom` flow unless they change them.

This improves browse discovery, room setup consistency, creator defaults, a filterable live grid, and future analytics. It fits the existing StreamYolo patterns: OpenAPI-first contract, Prisma schema, `RoomService` discovery queries, `GoLiveEligibility` gates, and creator defaults on `CreatorProfile` (same idea as private-session rules).

---

## Current State

| Area | Today |
| --- | --- |
| `Room` model | `title`, `slug`, `status`, `visibility`, media IDs, viewer count — no taxonomy fields |
| `CreatorProfile` | Private-session defaults only; no room discovery metadata |
| `GET /rooms` (`listRooms`) | Filters by `status`, `visibility=PUBLIC`, optional title `q` search |
| `PrepareRoomPage` | Title + visibility only |
| `RoomsPage` | Title search only; no category/tag/country filters |

---

## Product Rules

### Category (required at go-live)

| Rule | Detail |
| --- | --- |
| Cardinality | **One** category per room |
| Values (V1) | `BUSINESS`, `MUSIC`, `COMEDY`, `EDUCATION` |
| Mutability | Editable while room is `DRAFT`; locked once `LIVE` (same as title/thumbnail policy) |
| Browse filter | **Multi-select** — viewer can pick multiple categories; rooms match if `category IN selected` (OR within category) |

Categories are a **closed enum**, not user-created. New categories require a schema + spec change.

Example browse URL:

```
/rooms?category=MUSIC&category=COMEDY
```

### Tags (optional at prepare, recommended at go-live)

| Rule | Detail |
| --- | --- |
| Cardinality | **Zero to N** tags per room |
| Source | **Pre-defined catalog** only — creators pick from a list; no free-text tags in V1 |
| Reuse | Creator's last-used tag set is offered as default on the next room |
| Filter | Viewer selects one or more tags; room matches if it has **any** of the selected tags (OR within tags) |
| Limit | Max **10 tags** per room (configurable constant) |
| Go-live | **Optional** — nudge in UI, not blocking |

Tag slugs are stable API identifiers; labels are display-only. Tags are **seed-only in V1** — no admin CRUD UI. Deactivation is done via DB/seed (`isActive: false`).

**Ethnicity / look tags** are common in the market but can get messy fast. Keep them admin-curated (seed catalog), grouped separately in UI, and easy to deactivate without code deploy (flip `isActive` in DB). Review periodically.

Examples of seed tags (grouped for UI):

| Group | Example tags |
| --- | --- |
| Ethnicity / look | `latina`, `asian`, `ebony`, `caucasian`, `middle-eastern`, `milf`, `mature`, `young-adult`, `college-vibe`, `new-model` |
| Body | `petite`, `curvy`, `bbw`, `athletic`, `tattooed` |
| Activity | `interactive-toys`, `roleplay`, `asmr`, `gaming`, `fitness`, `cooking` |
| Language | `english`, `spanish`, `french`, `german`, `portuguese` |

Do **not** use compliance-risky slugs like `teen-18-plus`. Prefer neutral age/presentation terms: `young-adult`, `college-vibe`, `new-model`.

### Country of origin (required at go-live)

| Rule | Detail |
| --- | --- |
| Cardinality | **One** ISO 3166-1 alpha-2 code per room (e.g. `US`, `GB`, `BR`) |
| Backend validation | **Full ISO 3166-1 alpha-2** allowlist (~249 codes) |
| Frontend UI | **Curated presentation** — popular countries first, full list searchable below |
| Reuse | Creator's last-used country pre-fills the next room |
| Browse filter | Multi-select; `countryCode IN selectedCountries` (OR within country) |
| Display | Flag + country name in UI; code in API |

Country is **room metadata** (where the stream is presented from), not verified KYC address. Verification is out of scope for V1.

No separate `Country` table in V1. Server ships a static ISO JSON asset for validation and `getRoomTaxonomy`. Frontend duplicates a `popularCountryCodes` constant for dropdown ordering (does not limit what creators can select).

### Filter semantics (canonical)

```
results = rooms
  WHERE status = LIVE
  AND visibility = PUBLIC
  AND category IN selectedCategories        -- omit if none selected
  AND countryCode IN selectedCountries      -- omit if none selected
  AND room has ANY selected tag             -- omit if none selected
  AND title CONTAINS q                      -- omit if empty
```

- **Across dimensions:** AND
- **Within each dimension** (categories, countries, tags): OR

Default sort remains `createdAt desc` (viewer count sort is a follow-up).

---

## Go-live eligibility

| Field | Required at go-live |
| --- | --- |
| Category | **Yes** — `ROOM_CATEGORY` |
| Country | **Yes** — `ROOM_COUNTRY` |
| Tags | **No** — optional; recommended in prepare UI |

Right friction level: taxonomy is mandatory for discovery integrity; tags stay optional to reduce setup friction.

---

## Creator Defaults (reuse across rooms)

**Profile-default + room-snapshot** — same pattern as private-session rules. Historical rooms do not mutate when creator defaults change.

### `CreatorProfile` additions

| Field | Type | Purpose |
| --- | --- | --- |
| `defaultRoomCategory` | `RoomCategory?` | Pre-fill category on new room |
| `defaultCountryCode` | `String?` (2 chars) | Pre-fill country on new room |

### `CreatorDefaultRoomTag` junction

| Field | Type |
| --- | --- |
| `creatorId` | FK → `CreatorProfile` |
| `tagId` | FK → `RoomTag` |

Unique on `(creatorId, tagId)`. Updated whenever the creator saves a room with tags and opts in to "Use these as my defaults" (default **on** in UI).

### Room snapshot fields

| Field | Model |
| --- | --- |
| `category` | `Room` |
| `countryCode` | `Room` |
| tag assignments | `RoomTagAssignment` |

### `prepareRoom` behavior

1. Load creator defaults (category, country, tags).
2. Merge with explicit request body fields (request wins).
3. Persist on the new `Room` + `RoomTagAssignment` rows.
4. If `saveAsDefaults: true` (default), upsert `CreatorProfile` defaults and `CreatorDefaultRoomTag`.

Creators who stream as different personas can change values per room; defaults just reduce repetitive data entry.

---

## Data Model

### New enum

```prisma
enum RoomCategory {
  BUSINESS
  MUSIC
  COMEDY
  EDUCATION
}
```

### New tables

```prisma
model RoomTag {
  id        String   @id @default(cuid())
  slug      String   @unique          // stable filter key, e.g. "latina"
  label     String                    // display name
  group     String?                   // UI grouping, e.g. "ethnicity"
  sortOrder Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  rooms            RoomTagAssignment[]
  creatorDefaults  CreatorDefaultRoomTag[]

  @@index([isActive, sortOrder])
  @@index([group])
}

model RoomTagAssignment {
  roomId String
  tagId  String

  room Room    @relation(fields: [roomId], references: [id], onDelete: Cascade)
  tag  RoomTag @relation(fields: [tagId], references: [id])

  @@id([roomId, tagId])
  @@index([tagId])
}

model CreatorDefaultRoomTag {
  creatorId String
  tagId     String

  creator CreatorProfile @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  tag     RoomTag        @relation(fields: [tagId], references: [id])

  @@id([creatorId, tagId])
  @@index([tagId])
}
```

### `Room` additions

```prisma
category    RoomCategory?
countryCode String?       @db.Char(2)

tags RoomTagAssignment[]

@@index([status, visibility, category])
@@index([status, visibility, countryCode])
```

`category` and `countryCode` are nullable in DB until set, but **required before go-live**.

### Inactive tags on live rooms

If a tag is deactivated (`isActive: false`):

- Keep showing on rooms that already have it
- Exclude from browse filter picker and new `prepareRoom` assignments
- Exclude from `getRoomTaxonomy` active tag list

---

## API Changes (OpenAPI)

### Taxonomy read endpoints (public)

| Method | Path | operationId | Purpose |
| --- | --- | --- | --- |
| `GET` | `/rooms/taxonomy` | `getRoomTaxonomy` | Categories enum, active tags (grouped), full ISO countries |

```yaml
RoomTaxonomy:
  categories: [{ value: MUSIC, label: Music }, ...]
  tags: [{ slug, label, group }, ...]          # isActive only
  countries: [{ code: US, name: United States }, ...]  # full ISO list
  popularCountryCodes: [US, GB, CA, ...]       # UI hint only; optional on response
```

`popularCountryCodes` is a server-provided or frontend constant list for dropdown ordering — it does not restrict API validation.

### `listRooms` query parameters

| Param | Type | Notes |
| --- | --- | --- |
| `category` | `RoomCategory` | Repeatable; `category=MUSIC&category=COMEDY`; OR semantics |
| `country` | `string` | ISO alpha-2; repeatable; OR semantics |
| `tag` | `string` | Tag slug; repeatable; OR semantics |
| `q` | `string` | Existing title search |

### Schema updates

**`RoomCard`** and **`RoomDetail`** — add:

```yaml
category:
  type: string
  enum: [BUSINESS, MUSIC, COMEDY, EDUCATION]
  nullable: true
countryCode:
  type: string
  minLength: 2
  maxLength: 2
  nullable: true
tags:
  type: array
  items:
    type: object
    required: [slug, label]
    properties:
      slug: { type: string }
      label: { type: string }
      group: { type: string, nullable: true }
```

**`PrepareRoomInput`** — add:

```yaml
category: { $ref: '#/components/schemas/RoomCategory' }
countryCode: { type: string, minLength: 2, maxLength: 2 }
tagSlugs:
  type: array
  items: { type: string }
  maxItems: 10
saveAsDefaults:
  type: boolean
  default: true
```

Validation:

- `category` must be a valid `RoomCategory` enum value.
- `countryCode` must be a valid ISO 3166-1 alpha-2 code from the full allowlist.
- Every `tagSlug` must resolve to an active `RoomTag`.
- Reject unknown slugs or country codes with `400`.

### `GoLiveEligibility.missing` — new codes

| Code | When |
| --- | --- |
| `ROOM_CATEGORY` | `room.category` is null |
| `ROOM_COUNTRY` | `room.countryCode` is null |

---

## Server Implementation Notes

### ISO country asset

Add `apps/server/src/lib/iso-countries.ts` (or `packages/shared`) exporting:

- `ISO_COUNTRY_CODES: readonly string[]` — full alpha-2 set
- `isValidCountryCode(code: string): boolean`
- `getCountryName(code: string): string | undefined`

Used by `RoomService.prepare`, `getRoomTaxonomy`, and tests.

### `RoomService.list`

```ts
...(params.categories?.length ? { category: { in: params.categories } } : {}),
...(params.countryCodes?.length ? { countryCode: { in: params.countryCodes } } : {}),
...(params.tagSlugs?.length ? {
  tags: { some: { tag: { slug: { in: params.tagSlugs }, isActive: true } } },
} : {}),
```

Include `tags: { include: { tag: true } }` in list/detail queries; map to DTO in `formatRoom`.

### `RoomService.prepare`

- Accept taxonomy fields.
- Validate tag count ≤ 10.
- Validate `countryCode` against full ISO allowlist.
- Replace `RoomTagAssignment` rows on update (delete + create in transaction).
- Upsert creator defaults when `saveAsDefaults !== false`.

### `RoomService._goLiveEligibility`

Append checks for `ROOM_CATEGORY` and `ROOM_COUNTRY`.

### Indexes

Composite indexes on `(status, visibility, category)` and `(status, visibility, countryCode)` support the default browse query. Tag filtering uses the `RoomTagAssignment.tagId` index.

---

## Frontend Changes

### Friendly browse URLs

Room detail stays at `/rooms/:slug`. Browse filters use **reserved path segments** so they never collide with room slugs:

| Path | Meaning |
| --- | --- |
| `/rooms` | All live public rooms |
| `/rooms/c/female` | Category filter |
| `/rooms/c/female+couples` | Multiple categories (OR) |
| `/rooms/country/us` | Country filter |
| `/rooms/country/us+gb` | Multiple countries (OR) |
| `/rooms/t/latina` | Tag filter |
| `/rooms/t/latina+gaming` | Multiple tags (OR) |
| `/rooms/c/female/country/us` | Combined filters |
| `/rooms/c/female/country/us/t/latina` | Full combined filters |
| `/rooms?q=synth` | Title search (query param only) |

Implementation: `apps/web/src/lib/roomBrowseRoutes.ts` provides `parseBrowsePath`, `buildBrowsePath`, and `browseFiltersToQuery`. Filter changes call `navigate(buildBrowsePath(...))`. Legacy `?category=MUSIC&country=US` URLs redirect to friendly paths on load.

API `listRooms` still uses query params (`category`, `country`, `tag`); the web layer maps friendly paths → API query.

### `RoomsPage` — filter bar

- Category **multi-select** chips (not single tab): e.g. Music + Comedy together
- Country multi-select: **popular countries first**, full ISO list searchable below
- Tag multi-select (grouped by `group`, searchable)
- Persist filter state in friendly URL paths (see above); title search uses `?q=`
- Call `useRooms({ category, country, tag, q })`

### `PrepareRoomPage` — taxonomy section

- Category: required radio group (pre-filled from defaults) — one per room
- Country: required searchable select — popular first, full ISO below (pre-filled)
- Tags: multi-select checklist from `getRoomTaxonomy` (pre-filled)
- Checkbox: "Remember for future rooms" (maps to `saveAsDefaults`, default checked)

### `RoomCard` component

- Show category badge, country flag/code, up to 3 tag chips (+N more)

### SDK

- `useRoomTaxonomy()` — `useQuery` on `GET /rooms/taxonomy`
- Extend `useRooms` params type with repeatable `category`, `country`, `tag`
- Extend `usePrepareRoom` body type

---

## Seed Data

### Categories

Enum only — no seed rows.

### Tags (initial catalog ~25–40)

Seed in `packages/db/prisma/seed.ts` via `RoomTag.upsert` on `slug`. Start conservative; expand from product/analytics.

**Starter set:**

- **Ethnicity / look:** `latina`, `asian`, `ebony`, `caucasian`, `middle-eastern`, `milf`, `mature`, `young-adult`, `college-vibe`, `new-model`
- **Body:** `petite`, `curvy`, `bbw`, `athletic`, `tattooed`
- **Activity:** `interactive-toys`, `roleplay`, `asmr`, `gaming`, `fitness`, `cooking`
- **Language:** `english`, `spanish`, `french`, `german`, `portuguese`

### Countries

No DB seed rows. Full ISO list lives in shared static JSON used by server validation and `getRoomTaxonomy`. Frontend maintains a `POPULAR_COUNTRY_CODES` constant for dropdown UX only.

### Dev rooms

Assign category, country, and 2–4 tags per live seed room so every category filter returns results in local dev.

---

## Implementation Order

Proceed strictly in this sequence:

| Step | Scope |
| --- | --- |
| **1** | Prisma schema + migration + seed tags |
| **2** | OpenAPI contract updates |
| **3** | `RoomService` prepare / list / eligibility + handlers |
| **4** | Tests (validation, filtering, go-live eligibility) |
| **5** | SDK generation (`pnpm sdk:generate`) |
| **6** | `PrepareRoomPage` taxonomy fields |
| **7** | `RoomsPage` filters (URL-synced) |
| **8** | `RoomCard` badges |

### Backward compatibility

- Existing rooms have `category = null`, `countryCode = null`, no tags.
- They remain listable until taxonomy is enforced at go-live for **new** streams.
- Optional one-time backfill for legacy `LIVE` rooms, or hide from browse until creator edits draft.

---

## Out of Scope (V1)

- User-created tags or categories
- Admin tag CRUD UI (seed catalog + DB `isActive` toggle only)
- Tag synonyms / merging
- Geo-IP auto-detection of country
- Per-viewer filter preferences (saved searches)
- Full-text search on tags
- Category on `CreatorProfile` public page (room-only in V1)
- Moderation queue for miscategorized rooms (manual reports only)

Admin tag CRUD (`GET/POST/PATCH /admin/room-tags`) deferred to V2.

---

## Resolved Decisions

| Question | Decision |
| --- | --- |
| Tags required at go-live? | **No** — optional; nudge in UI |
| Tag filter semantics | **OR** — room has any selected tag |
| Category browse filter | **Multi-select OR** — room has one category; viewer picks many |
| Country list | **Full ISO** on backend; **curated popular + searchable** in UI |
| Inactive tags on live rooms | Keep on room; hide from picker and new assignments |
| Comedy category | Content category only in V1 — not a multi-creator room feature |

---

## Success Criteria

- [ ] Creator prepares a room; category, country, and tags pre-fill from last session
- [ ] Creator cannot go live without category and country
- [ ] Browse page filters live public rooms by category (multi), country, and tags
- [ ] Filter state is reflected in URL and survives refresh
- [ ] `pnpm test` covers list filters, prepare validation, and go-live eligibility
- [ ] Seed data produces a non-empty grid for every category filter combination used in dev

---

## File Touch List (implementation reference)

| Package | Files |
| --- | --- |
| `packages/db` | `schema.prisma`, `seed.ts` |
| `packages/shared` or `apps/server` | `iso-countries.ts` (full ISO asset) |
| `packages/api-spec` | `openapi.yaml` |
| `packages/sdk` | generated types, `useRooms.ts`, new `useRoomTaxonomy.ts` |
| `apps/server` | `RoomService.ts`, `handlers/rooms.ts`, `__tests__/rooms.test.ts`, `__tests__/creator-rooms.test.ts` |
| `apps/web` | `RoomsPage.tsx`, `PrepareRoomPage.tsx`, `RoomCard.tsx`, `popularCountryCodes.ts` (UI constant) |
