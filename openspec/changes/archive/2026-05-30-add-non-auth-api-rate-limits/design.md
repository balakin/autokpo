## Context

The worker is a Hono application mounted from `apps/app/worker/main.ts`. Better Auth handles `/api/auth/*` and already provides database-backed rate limiting for auth endpoints, including the current OTP email rule and Turnstile protection.

The non-auth application APIs under `/api/sync*`, `/api/e2ee/*`, and `/api/exchange-rates/*` are session-gated inside their endpoint handlers. That protects data access, but it does not provide a common place to apply user-scoped rate limits before expensive route logic, D1 work, or upstream proxy calls.

Cloudflare WAF rate limiting is not assumed to be available. Rate limiting must therefore run inside the Worker while avoiding IP addresses as the primary identity for authenticated application APIs.

## Goals / Non-Goals

**Goals:**

- Keep existing Better Auth rate limiting unchanged for `/api/auth/*`.
- Add reusable Hono middleware that resolves a valid session for non-auth application APIs and stores it on the request context.
- Add Cloudflare Workers Rate Limiting binding checks for authenticated application route groups.
- Use authenticated user id plus route group as the limiter key.
- Return `429 Too Many Requests` before route business logic when a user exceeds the configured limit.
- Keep route-specific authorization checks near the relevant route logic.

**Non-Goals:**

- Do not replace Better Auth's built-in auth endpoint rate limiting.
- Do not add Cloudflare WAF rules.
- Do not use D1, KV, or in-memory counters for non-auth API rate limiting.
- Do not implement billing-grade exact quotas.
- Do not hide domain-specific checks, such as sync local-user validation, inside a generic auth middleware.

## Decisions

### Use Cloudflare Workers Rate Limiting bindings for non-auth API limits

The limiter will use Cloudflare's native Workers Rate Limiting binding from inside the Worker. This avoids storing hot counters in D1 and avoids KV's eventual-consistency and hot-key trade-offs for request counters.

Alternatives considered:

- **D1 counters**: rejected for non-auth API limits because every app request would add extra database reads/writes on already important paths.
- **KV counters**: rejected for the first version because KV is approximate and DIY; it remains a fallback if the native binding is unsuitable.
- **Durable Objects**: deferred because they add more architecture and are only needed if stricter app-controlled counters become necessary.
- **In-memory counters**: rejected for production because Worker isolates restart and scale independently.

### Authenticate before rate limiting application APIs

Non-auth application limits will run after a session has been resolved. The authentication middleware will call the existing Better Auth session helper and store the session on Hono context so downstream middleware can build keys from `session.user.id`.

This avoids using IP address, region, or country as the primary key for authenticated users, reducing false positives for shared networks, VPNs, mobile carriers, and office NATs.

### Limit by route group

Rate-limit keys will include the authenticated user id and a route group name, such as `sync`, `e2ee`, or `exchange-rates`.

This keeps limits fair per user while allowing route groups to have different thresholds. The first implementation can use one binding or multiple bindings depending on Cloudflare configuration needs, but the application contract is route-group-based limits.

### Preserve endpoint-specific authorization

Generic auth middleware will answer "who is the caller?" only. Route-specific checks will remain in the relevant route group, such as sync's `X-Local-User-Id` match against the authenticated user.

## Risks / Trade-offs

- **Workers Rate Limiting is not exact quota accounting** → Treat it as abuse prevention and application protection, not billing-grade enforcement.
- **Middleware ordering mistakes could limit by IP or miss session context** → Mount non-auth route middleware in the order `requireAuth` then `rateLimit` then route handlers.
- **Too-strict initial limits could affect legitimate sync bursts** → Start with conservative limits and make thresholds easy to tune from configuration/code constants.
- **Cloudflare binding configuration may require type regeneration** → Update `wrangler.jsonc` and regenerate/check `worker-configuration.d.ts` as part of implementation.
- **Tests need a mock limiter binding** → Worker tests should provide deterministic allow/deny behavior for the binding.

## Migration Plan

1. Add the Cloudflare Workers Rate Limiting binding configuration and regenerate Worker types.
2. Add shared non-auth API auth middleware that stores session context.
3. Add rate-limit middleware that reads the stored session and checks the configured route-group limiter.
4. Mount middleware on `/api/sync*`, `/api/e2ee/*`, and `/api/exchange-rates/*` before route handlers.
5. Update handlers to read the session from context where appropriate while preserving route-specific authorization checks.
6. Add tests for allowed requests, rate-limited `429` responses, and unchanged auth endpoint behavior.

Rollback is to remove the non-auth middleware mounts and binding configuration; Better Auth auth endpoint limits remain independent.

## Open Questions

- What exact initial limits should be used for `sync`, `e2ee`, and `exchange-rates` route groups?
- Should read and write operations in the same route group share a limit initially, or should writes use stricter limits from the start?
