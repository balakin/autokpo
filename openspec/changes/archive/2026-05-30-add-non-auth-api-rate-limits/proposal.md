## Why

Non-authenticated Better Auth endpoints already have built-in abuse protection, but authenticated application APIs currently rely on endpoint-local session checks without a shared rate-limiting layer. Adding user-scoped limits protects sync, E2EE, and exchange-rate APIs from accidental loops and authenticated abuse without using IP addresses as the primary identity.

## What Changes

- Add a reusable authentication middleware for non-auth application APIs that resolves the Better Auth session and stores it on the Hono context.
- Add Cloudflare Workers Rate Limiting binding checks for protected non-auth route groups.
- Key non-auth API limits by authenticated user id plus route group, not by IP address or region.
- Keep existing Better Auth rate limiting for `/api/auth/*`, including the current OTP email limit and Turnstile protection.
- Preserve route-specific authorization checks, such as sync's local-user ownership validation, inside the relevant route group.

## Capabilities

### New Capabilities

- `api-rate-limiting`: Authenticated application API endpoints enforce user-scoped rate limits before expensive route logic runs.

### Modified Capabilities

- `cloudflare-worker`: Worker configuration exposes Cloudflare Workers Rate Limiting bindings required by the authenticated API limiter.

## Impact

- Affected worker entry and routing code: `apps/app/worker/main.ts`, non-auth route mounting, and shared worker middleware.
- Affected route groups: `/api/sync*`, `/api/e2ee/*`, and `/api/exchange-rates/*`.
- Affected platform configuration: Cloudflare Worker/Wrangler bindings for rate limiting.
- Affected tests: worker route tests should cover authenticated allow/deny behavior and `429` responses from the limiter.
