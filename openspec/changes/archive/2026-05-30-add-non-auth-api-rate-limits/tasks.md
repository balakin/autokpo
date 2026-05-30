## 1. Platform Configuration

- [x] 1.1 Add Cloudflare Workers Rate Limiting binding configuration to `apps/app/wrangler.jsonc` for the non-auth API limiter.
- [x] 1.2 Regenerate `apps/app/worker-configuration.d.ts` so the Worker `Env` type includes the rate-limit binding.
- [x] 1.3 Add or update worker test setup mocks so tests can simulate allowed and rate-limited binding responses.

## 2. Shared Middleware

- [x] 2.1 Add typed Hono context support for storing the authenticated Better Auth session on non-auth API requests.
- [x] 2.2 Create reusable `requireAuth` middleware that validates the session and stores it on Hono context.
- [x] 2.3 Create reusable route-group rate-limit middleware that reads the session, builds a `user.id + route group` key, calls the Cloudflare rate-limit binding, and returns `429` when limited.

## 3. Route Integration

- [x] 3.1 Mount `requireAuth` before the rate-limit middleware for `/api/sync*`, `/api/e2ee/*`, and `/api/exchange-rates/*`.
- [x] 3.2 Mount route-group rate limits for `sync`, `e2ee`, and `exchange-rates` before their handlers.
- [x] 3.3 Update route handlers to read the authenticated session from context where appropriate while preserving existing route-specific authorization checks.
- [x] 3.4 Keep `/api/auth/*` routed through Better Auth without the non-auth API limiter.

## 4. Tests and Verification

- [x] 4.1 Add worker tests showing under-limit authenticated requests continue to non-auth route handlers.
- [x] 4.2 Add worker tests showing over-limit authenticated requests return `429 Too Many Requests` before route business logic.
- [x] 4.3 Add tests or assertions showing users sharing an IP use separate limiter keys because keys include `session.user.id`.
- [x] 4.4 Add regression coverage that Better Auth OTP/auth endpoint rate limiting behavior remains unchanged.
- [x] 4.5 Run targeted worker tests and type/build checks relevant to Worker configuration and route middleware.
