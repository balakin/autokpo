## Why

Mutation endpoints (`/api/sync`, `/api/profile/avatar`) rely on session cookies for authentication but have no server-side enforcement that requests originate from the app itself, leaving them theoretically vulnerable to CSRF. Adding an explicit origin check mirrors the protection better-auth already applies to its own endpoints and makes the security property intentional rather than a side-effect of missing CORS headers.

## What Changes

- New Hono middleware (`worker/csrf.ts`) that validates the `Origin`/`Referer` header against `APP_URL` for all non-safe, cookie-bearing requests
- Middleware applied globally (`app.use('*', ...)`) in `worker/main.ts`, covering all current and future worker endpoints
- `BETTER_AUTH_URL` env var renamed to `APP_URL` — it now serves a broader purpose than just better-auth configuration
- Worker types regenerated; test helpers updated to include `Origin` header on authenticated requests

## Capabilities

### New Capabilities

- `csrf-origin-check`: Server-side CSRF protection via Origin header validation for all non-safe worker endpoints

### Modified Capabilities

_(none — no existing spec-level behavior changes)_

## Impact

- **`worker/main.ts`**: adds global `csrfMiddleware()` before all routes
- **`worker/csrf.ts`**: new file
- **`wrangler.jsonc`**: `BETTER_AUTH_URL` → `APP_URL` (deploy-time env var rename required)
- **`worker-configuration.d.ts`**: regenerated
- **`worker/auth.ts`**: reads `APP_URL` instead of `BETTER_AUTH_URL`
- **`tests/worker/auth-helpers.ts`**, **`request-helpers.ts`**, **`avatars.spec.ts`**: updated variable names and `Origin` header in test requests
