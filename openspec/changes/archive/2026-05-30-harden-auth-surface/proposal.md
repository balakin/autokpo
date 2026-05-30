## Why

The Better Auth handler is mounted on `/api/auth/*`, which exposes unused auth endpoints and currently has no auth-specific request body limit. Some auth-controlled data, such as session metadata and OAuth account fields, can also be influenced by request headers, request bodies, or OAuth provider responses before reaching D1.

This change hardens the auth boundary by reducing the reachable auth surface, adding explicit abuse limits, and making persisted auth data intentionally minimal.

## What Changes

- Add an auth-specific pre-parse body size limit of 16 KiB for `/api/auth/*` requests.
- Add explicit database-backed Better Auth global rate limiting for all auth endpoints while preserving the stricter OTP-send limit.
- Restrict reachable Better Auth endpoints to the flows the app uses: session lookup, Google/GitHub OAuth, email OTP sign-in, sign-out, account deletion, session listing/revocation, and account listing.
- Disable or block unused Better Auth password, email verification, account update, account linking, unlinking, and unused email-OTP auxiliary endpoints.
- Stop encrypting OAuth tokens because the app policy is to never persist OAuth tokens.
- Change OAuth account persistence to an explicit allowlist: only identity-linking fields are preserved, and token/credential fields are forced to `null`.
- Bound persisted session metadata so oversized or garbage request metadata cannot be stored raw in D1.
- Validate small app-specific auth inputs, including email length and preferred-locale header values.
- Add regression tests for blocked endpoints, oversized auth bodies, rate-limit behavior, OAuth token non-persistence, and bounded session metadata.

## Capabilities

### New Capabilities

<!-- None. This change hardens existing auth capabilities. -->

### Modified Capabilities

- `auth-abuse-prevention`: Add requirements for global auth rate limiting, auth endpoint surface reduction, email/header input bounds, and bounded persisted auth metadata.
- `backend-payload-limits`: Extend backend payload limits to include auth endpoints with a 16 KiB pre-parse body limit.
- `social-auth-data-minimization`: Strengthen OAuth account persistence requirements to use an explicit allowlist and remove token encryption when tokens are never persisted.
- `account-session-management`: Clarify that displayed session metadata may be bounded/normalized before persistence and must remain safe to render.

## Impact

- Worker auth routing and middleware order in `apps/app/worker/main.ts`.
- Better Auth configuration and database hooks in `apps/app/worker/auth-options.ts`.
- Auth payload constants in `apps/app/worker/payload-limits.ts` or nearby worker limit definitions.
- Auth-related D1 persistence behavior for `account` and `session` records.
- Client auth flows that depend on Better Auth endpoints under `/api/auth/*`.
- Worker and UI tests covering email OTP, OAuth, account sessions, and account deletion.
