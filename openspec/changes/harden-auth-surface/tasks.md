## 1. Auth Boundary Limits

- [x] 1.1 Add a shared `MAX_AUTH_BODY_BYTES` constant set to 16 KiB in the worker payload-limit module.
- [x] 1.2 Apply Hono `bodyLimit` to `/api/auth/*` before the Better Auth handler while preserving CSRF handling.
- [x] 1.3 Add worker tests proving oversized auth bodies return HTTP 413 before Better Auth processing.
- [x] 1.4 Add worker tests proving normal supported auth requests still reach Better Auth.

## 2. Auth Endpoint Surface

- [x] 2.1 Keep auth routing simple and rely on Better Auth route handling for `/api/auth/*` after body limiting.
- [x] 2.2 Reject known unused auth paths through Better Auth disabled route configuration.
- [x] 2.3 Configure Better Auth `disabledPaths` for known unused password, password reset, email verification, account update, account linking/unlinking, and unused email-OTP auxiliary endpoints.
- [x] 2.4 Add tests that required endpoints remain reachable: session lookup, Google/GitHub callbacks, email OTP send/sign-in, sign-out, delete-user, session list/revoke, revoke-other-sessions, and account list.
- [x] 2.5 Add tests that representative unused endpoints are blocked before Better Auth.

## 3. Rate Limiting and Input Bounds

- [x] 3.1 Configure Better Auth rate limiting with explicit `enabled: true`, D1 database storage, and a global auth window/max policy.
- [x] 3.2 Preserve the stricter `/email-otp/send-verification-otp` custom rate-limit rule.
- [x] 3.3 Add tests or update existing tests to verify OTP-send rate limiting still rejects over-limit requests.
- [x] 3.4 Enforce a 254-character maximum for trimmed auth email inputs before OTP side effects or persistence-sensitive processing.
- [x] 3.5 Normalize `X-Preferred-Locale` through an allowlist of supported locales before using it in auth email side effects.
- [x] 3.6 Keep captcha validation delegated to Better Auth's captcha plugin after auth body limiting.
- [x] 3.7 Add tests for oversized email rejection and unsupported locale fallback.

## 4. OAuth Account Data Minimization

- [x] 4.1 Remove `encryptOAuthTokens: true` from the Better Auth account configuration.
- [x] 4.2 Replace the account create hook's spread-and-null behavior with explicit allowlisted account persistence data.
- [x] 4.3 Force `accessToken`, `refreshToken`, `idToken`, `scope`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, and `password` to `null` in persisted account rows.
- [x] 4.4 Ensure returning OAuth sign-ins do not update existing account rows with token values.
- [x] 4.5 Add or update OAuth worker tests asserting Google/GitHub account rows retain identity-linking fields and null token/credential fields.

## 5. Session Metadata Bounds

- [x] 5.1 Add Better Auth session create/update hooks or supported configuration to bound persisted `userAgent` values.
- [x] 5.2 Decide and implement the IP metadata policy: disable IP tracking if acceptable, otherwise bound persisted `ipAddress` values.
- [x] 5.3 Verify Account settings continues to display bounded metadata and fallback text for unavailable metadata.
- [x] 5.4 Add tests proving oversized `User-Agent` values are not persisted raw.
- [x] 5.5 Add tests proving IP metadata is either absent by policy or persisted within the configured bound.

## 6. Verification

- [x] 6.1 Run targeted worker auth tests with verbose Vitest output.
- [x] 6.2 Run Account settings tests affected by session metadata display.
- [x] 6.3 Run the app build/typecheck.
- [x] 6.4 Run the full app test suite if targeted checks pass.
- [x] 6.5 Review the final diff for accidental auth-surface expansion or persisted secret regressions.
