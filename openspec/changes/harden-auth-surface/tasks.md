## 1. Auth Boundary Limits

- [ ] 1.1 Add a shared `MAX_AUTH_BODY_BYTES` constant set to 16 KiB in the worker payload-limit module.
- [ ] 1.2 Apply Hono `bodyLimit` to `/api/auth/*` before the Better Auth handler while preserving CSRF handling.
- [ ] 1.3 Add worker tests proving oversized auth bodies return HTTP 413 before Better Auth processing.
- [ ] 1.4 Add worker tests proving normal supported auth requests still reach Better Auth.

## 2. Auth Endpoint Surface

- [ ] 2.1 Define an app-level allowlist for required Better Auth methods and paths under `/api/auth/*`.
- [ ] 2.2 Reject non-allowlisted auth paths or methods before the Better Auth handler with a non-enumerating response.
- [ ] 2.3 Configure Better Auth `disabledPaths` for known unused password, password reset, email verification, account update, account linking/unlinking, and unused email-OTP auxiliary endpoints.
- [ ] 2.4 Add tests that required endpoints remain reachable: session lookup, Google/GitHub callbacks, email OTP send/sign-in, sign-out, delete-user, session list/revoke, revoke-other-sessions, and account list.
- [ ] 2.5 Add tests that representative unused endpoints are blocked before Better Auth.

## 3. Rate Limiting and Input Bounds

- [ ] 3.1 Configure Better Auth rate limiting with explicit `enabled: true`, D1 database storage, and a global auth window/max policy.
- [ ] 3.2 Preserve the stricter `/email-otp/send-verification-otp` custom rate-limit rule.
- [ ] 3.3 Add tests or update existing tests to verify OTP-send rate limiting still rejects over-limit requests.
- [ ] 3.4 Enforce a 254-character maximum for trimmed auth email inputs before OTP side effects or persistence-sensitive processing.
- [ ] 3.5 Normalize `X-Preferred-Locale` through an allowlist of supported locales before using it in auth email side effects.
- [ ] 3.6 Add a reasonable guard for obviously oversized `x-captcha-response` values before Turnstile validation.
- [ ] 3.7 Add tests for oversized email rejection, unsupported locale fallback, and oversized captcha response rejection.

## 4. OAuth Account Data Minimization

- [ ] 4.1 Remove `encryptOAuthTokens: true` from the Better Auth account configuration.
- [ ] 4.2 Replace the account create hook's spread-and-null behavior with explicit allowlisted account persistence data.
- [ ] 4.3 Force `accessToken`, `refreshToken`, `idToken`, `scope`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, and `password` to `null` in persisted account rows.
- [ ] 4.4 Ensure returning OAuth sign-ins do not update existing account rows with token values.
- [ ] 4.5 Add or update OAuth worker tests asserting Google/GitHub account rows retain identity-linking fields and null token/credential fields.

## 5. Session Metadata Bounds

- [ ] 5.1 Add Better Auth session create/update hooks or supported configuration to bound persisted `userAgent` values.
- [ ] 5.2 Decide and implement the IP metadata policy: disable IP tracking if acceptable, otherwise bound persisted `ipAddress` values.
- [ ] 5.3 Verify Account settings continues to display bounded metadata and fallback text for unavailable metadata.
- [ ] 5.4 Add tests proving oversized `User-Agent` values are not persisted raw.
- [ ] 5.5 Add tests proving IP metadata is either absent by policy or persisted within the configured bound.

## 6. Verification

- [ ] 6.1 Run targeted worker auth tests with verbose Vitest output.
- [ ] 6.2 Run Account settings tests affected by session metadata display.
- [ ] 6.3 Run the app build/typecheck.
- [ ] 6.4 Run the full app test suite if targeted checks pass.
- [ ] 6.5 Review the final diff for accidental auth-surface expansion or persisted secret regressions.
