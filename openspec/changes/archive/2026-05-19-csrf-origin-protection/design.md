## Context

The worker exposes mutation endpoints (`POST /api/sync`, `POST /api/sync/compact`, `PUT /api/profile/avatar`, `DELETE /api/profile/avatar`) that authenticate via session cookies managed by better-auth. CORS preflights and non-simple content types provide implicit browser-level protection, but there is no explicit server-side enforcement that a request originates from the app's own origin.

better-auth already applies an equivalent check to its own `/api/auth/*` routes: for any non-safe request that carries a `Cookie` header, it validates `Origin` (falling back to `Referer`) against its configured `trustedOrigins` list, rejecting absent or mismatched values with 403.

## Goals / Non-Goals

**Goals:**

- Explicit, server-enforced CSRF protection on all worker endpoints
- Consistent behavior with better-auth's own origin check
- Zero impact on legitimate same-origin requests from the PWA
- Protection for any future endpoints without requiring per-route opt-in

**Non-Goals:**

- Token-based CSRF (double-submit, synchronizer token) — origin checking is sufficient for a same-origin SPA
- CORS policy (separate concern; the app has no cross-origin callers)
- Protecting read-only (GET/HEAD) endpoints — these carry no side effects

## Decisions

### Global middleware over per-route checks

Applied as `app.use('*', csrfMiddleware())` in `main.ts` rather than added to individual route handlers or to `requireSession`.

**Alternatives considered:**

- _Inside `requireSession`_: natural chokepoint but conflates authentication with CSRF, and GET routes also call `requireSession` — the check would incorrectly apply to reads.
- _Per-route middleware_: explicit but requires opt-in on every new route; easy to forget.
- _Global on `/api/_`only*: would skip`/avatars/_`mutations (PUT/DELETE avatar). Using`_` is simpler and covers everything.

Better-auth handles its own CSRF internally so the redundant check on `/api/auth/*` is harmless.

### Cookie-presence as trigger condition (mirrors better-auth)

The check fires only when a `Cookie` header is present. Requests without cookies carry no session and cannot be CSRF-attacked — rejecting them would break server-to-server or unauthenticated callers unnecessarily.

### `Origin` with `Referer` fallback

Browsers always send `Origin` on non-safe cross-origin requests. `Referer` is included as a fallback for edge cases (some browser extensions strip `Origin`). If both are absent on a cookie-bearing mutation, the request is rejected — this matches better-auth's behavior.

### `APP_URL` env var (renamed from `BETTER_AUTH_URL`)

The base URL was already configured as `BETTER_AUTH_URL` for better-auth. Since it now also drives CSRF validation, it is renamed to `APP_URL` to reflect its broader role. better-auth continues to read the same value via `env.APP_URL`.

### Single trusted origin (no wildcard support)

`APP_URL` is a single concrete URL per environment (no wildcards needed). The check uses `new URL(APP_URL).origin` and a `startsWith` comparison, which is safe for scheme+host matching. Wildcard support (as in better-auth's `matchesOriginPattern`) is unnecessary for this deployment model.

## Risks / Trade-offs

- **Deploy-time env var rename** → `BETTER_AUTH_URL` must be renamed to `APP_URL` in Cloudflare dashboard / CI secrets before deploying. Deploying the new worker with the old var name will cause auth to break (better-auth reads the same env var). → Mitigation: rename the secret in the dashboard as part of the deploy step.
- **Referer stripping by proxies** → Some corporate proxies strip `Referer`. If `Origin` is also absent (unusual for modern browsers), cookie-bearing mutations would be rejected. → Acceptable trade-off; consistent with better-auth's posture.

## Migration Plan

1. Rename `BETTER_AUTH_URL` → `APP_URL` in Cloudflare Workers environment (dashboard or `wrangler secret`).
2. Deploy the updated worker.
3. No client-side or database changes required.

**Rollback**: revert the worker deploy; rename the env var back.

## Open Questions

_(none)_
