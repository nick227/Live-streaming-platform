# Coding Standards & Style Guide

## Language

- TypeScript strict mode.
- Avoid `any` except explicit escape hatches.
- Prefer discriminated unions for statuses and event types.

## Formatting

- Prettier for formatting.
- ESLint for linting.
- Consistent import sorting.
- No unused exports.

## API style

- Validate request bodies with zod or equivalent.
- Return typed DTOs, not raw database rows.
- Use standard error response shape.

```ts
interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: unknown
  }
}
```

## Service style

- Route handlers are thin.
- Business rules live in services.
- Database access either via repository or service, but keep transaction boundaries obvious.
- Money/token mutations must happen in explicit transactions.

## Frontend style

- Feature-first organization.
- Small components for controls/cards/panels.
- Avoid over-global state.
- Use server state library only if needed.
- Room UI should be chromeless and video-first.

## Error handling

- Use typed application errors.
- Log server errors with context.
- Never expose raw provider payloads to non-admin users.

## Security standards

- No secrets in code.
- No client-trusted prices or wallet balances.
- Enforce auth on backend.
- Escape/sanitize chat.

## Testing standards

- Unit tests for wallet ledger.
- Integration tests for payments/webhooks.
- E2E tests for room, tip, private session.
- Admin critical actions smoke tests.
