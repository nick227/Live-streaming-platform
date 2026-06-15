# SDK Reference

The `@streamyolo/sdk` package is the only bridge between the frontend and the API server. Pages import hooks; hooks call the typed API client; the client is generated from the OpenAPI spec.

## Install

The SDK is a workspace package — no `npm install` needed:

```ts
import { useWallet, useCreateTip } from '@streamyolo/sdk'
```

## Client setup

The API client is created once in `apps/web/src/main.tsx`:

```ts
import { createApiClient } from '@streamyolo/sdk'

createApiClient({ baseUrl: import.meta.env.VITE_API_URL })
```

After this call, all hooks share the same configured client. Never call `createApiClient` inside a component.

## Query hooks

All read hooks wrap `useQuery`. They return React Query's standard `UseQueryResult`.

```ts
const { data, isLoading, isError } = useWallet()
// data shape: { data: { wallet: WalletDto; ledger: LedgerEntryDto[] } }
```

**Data path note:** All hooks return the raw API response envelope. Unwrap with `data?.data` to reach the payload:

```ts
const balance = data?.data?.wallet?.tokenBalance ?? 0
const ledger  = data?.data?.ledger ?? []
```

## Mutation hooks

All write hooks wrap `useMutation`. Call `.mutateAsync()` inside a `try/catch`:

```ts
const tip = useCreateTip()

await tip.mutateAsync({ roomId, creatorId, amountTokens: 50 })
```

Use `mutation.isPending` to drive loading state on the submit button.

## Hook index

### Auth
| Hook | Method | Description |
|---|---|---|
| `useCurrentUser` | GET | Logged-in user |
| `useLogin` | POST | Returns session cookie |
| `useRegister` | POST | Creates account |
| `useLogout` | POST | Clears session |

### Rooms
| Hook | Method | Description |
|---|---|---|
| `useRooms` | GET | Public room list |
| `useRoom(slug)` | GET | Room detail |
| `usePrepareRoom(roomId)` | PATCH | Set title/thumbnail |
| `useGoLive(roomId)` | POST | Start stream |
| `useEndRoom(roomId)` | POST | End stream |
| `useRoomMessages(roomId)` | GET | Chat history |
| `useRoomMenu(roomId)` | GET | Tip menu + goal |

### Creator
| Hook | Method | Description |
|---|---|---|
| `useCreatorProfile` | GET | Own profile |
| `useUpdateCreatorProfile` | PATCH | Bio, rates, rules |
| `useCreatorMenuItems` | GET | Menu item list |
| `useCreateCreatorMenuItem` | POST | Add menu item |
| `useUpdateCreatorMenuItem` | PATCH | Edit menu item |
| `useDeleteCreatorMenuItem` | DELETE | Remove menu item |
| `useCreatorEarnings` | GET | Pending balance + ledger |
| `useGetLivekitToken(roomId)` | GET | Join token for LiveKit |
| `useAcknowledgeTip` | POST | Mark tip seen |
| `useCompleteTip` | POST | Mark tip fulfilled |

### Tips
| Hook | Method | Description |
|---|---|---|
| `useCreateTip` | POST | Send a tip |

### Wallet
| Hook | Method | Description |
|---|---|---|
| `useWallet` | GET | Balance + ledger |

### Payments
| Hook | Method | Description |
|---|---|---|
| `useTokenPacks` | GET | Available token packs |
| `useCreateCcbillCheckout` | POST | Get CCBill checkout URL |

### Private Sessions
| Hook | Method | Description |
|---|---|---|
| `useRequestPrivateSession` | POST | Viewer requests session |
| `useAcceptPrivateSession` | POST | Creator accepts |
| `useDeclinePrivateSession` | POST | Creator declines |
| `useStartPrivateSession` | POST | Creator starts billing |
| `useEndPrivateSession` | POST | Either party ends |

### Media
| Hook | Method | Description |
|---|---|---|
| `useUploadMedia` | POST | Upload file |
| `useCaptureRoomThumbnail` | POST | Set room thumbnail |

### Reports
| Hook | Method | Description |
|---|---|---|
| `useCreateReport` | POST | File a report |

### Admin (23 hooks)
See `packages/sdk/src/hooks/useAdmin.ts`. Prefix: `useAdmin*`. Covers overview, rooms, users, creators, payments, wallets, private sessions, media, and reports.

## Adding a new hook

1. Add the route to `packages/api-spec/openapi.yaml`
2. Run `pnpm sdk:generate`
3. Write the hook in `packages/sdk/src/hooks/useYourDomain.ts`
4. Export from `packages/sdk/src/hooks/index.ts`
5. Import in the page: `import { useYourHook } from '@streamyolo/sdk'`

Never add a hook directly inside `apps/web/`.

## Type generation

Types in `packages/sdk/src/generated/types.ts` are machine-generated — never edit them. If a response shape is wrong, fix the OpenAPI spec and re-run `pnpm sdk:generate`.
