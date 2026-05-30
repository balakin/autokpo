## Context

The Worker currently routes all `GET` and `POST` requests under `/api/auth/*` directly to Better Auth after CSRF validation. Non-auth encrypted endpoints already have Hono `bodyLimit` middleware, but auth endpoints do not. Better Auth provides rate limiting, `disabledPaths`, and database hooks, but it does not document a JS/TS body-size limit, a positive endpoint allowlist, or built-in maximum lengths for core session fields such as `userAgent`.

The app intentionally uses a narrow auth feature set: Google/GitHub OAuth, email OTP sign-in, session lookup, sign-out, account deletion, session management, and account listing. Other Better Auth core/plugin endpoints are not part of the product surface.

OAuth token persistence is already minimized by nulling token fields in an account create hook. However, `encryptOAuthTokens` runs before the database hook in Better Auth's OAuth callback flow, so it can spend CPU encrypting token values that the app later discards.

## Goals / Non-Goals

**Goals:**

- Reject oversized auth request bodies before Better Auth parses them.
- Make auth rate limiting explicit, database-backed, and broad enough to cover all auth endpoints.
- Hide or disable Better Auth endpoints that are not used by the app.
- Preserve current supported auth flows: Google OAuth, GitHub OAuth, email OTP, sign-out, account deletion, session list/revoke, and account list.
- Enforce the policy that OAuth tokens are never persisted, without paying encryption CPU for discarded tokens.
- Bound or normalize auth metadata before it becomes long-lived D1 data.
- Add tests that make the security boundary observable and prevent regressions.

**Non-Goals:**

- Replacing Better Auth or changing the public sign-in UX.
- Adding password authentication, account linking, email change, password reset, or profile update flows.
- Changing D1 table structure unless a test reveals that a schema constraint is required.
- Adding new external security dependencies.
- Implementing a generic WAF or request-header-size limiter in Hono; Cloudflare remains the outer header-size boundary.

## Decisions

### Use Better Auth `disabledPaths` for unused endpoints

The Worker will keep auth routing simple: CSRF, auth body limit, then Better Auth. Unused Better Auth routes will be blocked with Better Auth `disabledPaths`.

`disabledPaths` will be configured for known unused Better Auth routes such as email/password, password reset, email verification, account update, account linking/unlinking, and unused email-OTP auxiliary flows.

Alternative considered: an app-level positive allowlist. This gives a smaller surface but makes `main.ts` more complex and risks breaking Better Auth internal/provider flows. The implementation favors simplicity and Better Auth's supported route-disabling mechanism.

### Add a 16 KiB auth body limit before Better Auth

The Worker will apply Hono `bodyLimit` to `/api/auth/*` with a 16 KiB maximum. This limit is much smaller than Cloudflare's platform body limits and is sufficient for the app's auth JSON payloads: email OTP send/verify, social sign-in initiation, session revocation, and direct account deletion.

Alternative considered: 64 KiB. This is more permissive but unnecessary for the current auth surface. If provider or library behavior requires more room, the constant can be adjusted with tests.

### Make Better Auth rate limiting explicit and database-backed

Better Auth rate limiting will explicitly set `enabled: true`, `storage: 'database'`, and a global `window`/`max` for all auth endpoints. The existing stricter custom rule for `/email-otp/send-verification-otp` will remain.

Alternative considered: rely on Better Auth defaults. This is less clear because defaults differ by environment and the default global limit is not tailored to this app.

### Do not encrypt OAuth tokens that are never persisted

The app will remove `encryptOAuthTokens: true` from the Better Auth account config. OAuth account persistence will instead use a strict database hook that constructs the persisted account data from an explicit allowlist and forces token/credential fields to `null`.

Alternative considered: keep encryption as defense-in-depth. Better Auth encrypts before the account create hook, so keeping it spends CPU on data that the app discards. The stronger invariant is that OAuth tokens never reach D1.

### Use explicit account-field allowlisting instead of spread-and-null

The account create hook will stop spreading Better Auth's account object into the return data. It will preserve only identity-linking fields required for future sign-ins (`id`, `accountId`, `providerId`, `userId`, and timestamps if provided) and will explicitly set all token, scope, expiry, and password fields to `null`.

Alternative considered: continue spreading and null known token fields. This is more fragile if Better Auth adds new account fields that should not be persisted.

### Bound session metadata before persistence

Session create/update hooks will normalize request-derived metadata before insert/update. `userAgent` will be bounded to a fixed maximum length, and `ipAddress` will either be disabled through Better Auth IP tracking configuration if not needed or bounded to a small maximum before persistence.

Alternative considered: rely on Cloudflare's total header limit. Cloudflare limits total request headers to 128 KiB, which is still too large for a useful session metadata field.

### Validate small app-specific inputs at the auth boundary

Email values used in auth flows will be trimmed and capped to 254 characters where the app controls the email OTP side effect. The preferred-locale header will be treated as an allowlist rather than arbitrary text.

Alternative considered: rely on UI validation. UI validation is helpful but cannot protect the Worker from direct requests.

## Risks / Trade-offs

- Better Auth `disabledPaths` misses a newly added unused route → Add regression tests for representative unused routes and review auth routes during Better Auth upgrades.
- Better Auth changes endpoint paths in an upgrade → Tests fail during dependency updates; allowlist and `disabledPaths` are updated together.
- 16 KiB body limit is too small for a provider/library edge case → Keep the limit as a named constant and adjust only with a failing regression test or documented need.
- Removing token encryption exposes plaintext if the nulling hook regresses → Add tests that inspect persisted account rows after OAuth sign-in and assert token fields remain `null`.
- Truncating `userAgent` reduces fidelity in Account settings → Account settings only needs a useful device hint; bounded metadata is preferable to unbounded storage.
- Disabling or bounding IP metadata may reduce session diagnostics → Preserve current display behavior with fallback text and document the chosen policy in tests.

## Migration Plan

1. Add auth hardening constants and body-limit middleware around `/api/auth/*`.
2. Configure Better Auth global rate limiting and disabled paths.
3. Update account/session database hooks and remove OAuth token encryption.
4. Add focused worker tests for each security boundary.
5. Run targeted auth tests, then full app test/build checks.

Rollback is straightforward: remove the auth body-limit middleware and restore the previous Better Auth config. No data migration is expected because the desired persisted values are already compatible with existing nullable columns.

## Open Questions

- Should `ipAddress` tracking be disabled entirely, or retained with a small bound for Account settings? The default proposal is to retain bounded metadata unless implementation confirms disabling is simpler and acceptable.
