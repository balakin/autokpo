## 1. Better Auth and worker setup

- [x] 1.1 Extend the worker-side Better Auth configuration with the email OTP plugin and a `sendVerificationOTP` callback.
- [x] 1.2 Add Worker configuration for Resend delivery (`RESEND_API_KEY` secret plus sender identity config) and regenerate worker types if `wrangler.jsonc` changes.
- [x] 1.3 Update any auth CLI/schema configuration needed so Better Auth generation remains aligned with the new plugin setup.

## 2. Client auth flow

- [x] 2.1 Extend the Better Auth client configuration with the email OTP client plugin.
- [x] 2.2 Add auth-session helpers for requesting an email OTP and verifying an email OTP sign-in.
- [x] 2.3 Update the signed-out auth page to present Google sign-in plus the two-step email request/verify flow with basic loading and error states.
- [x] 2.4 Reuse the existing post-login session refresh path so successful email OTP sign-in persists the remembered local user id and enters the app.

## 3. Tests and fixtures

- [x] 3.1 Extend worker auth test helpers/fixtures to cover email OTP configuration and outbound email send behavior.
- [x] 3.2 Add app tests for the email OTP auth-entry flow, including request-code success, verify-code success, and verify failure states.
- [x] 3.3 Add worker or integration tests that prove successful email OTP verification creates the same authenticated session shape used by Google auth.

## 4. Validation and docs

- [x] 4.1 Update local development env documentation for the new Resend variables and any email auth setup expectations.
- [x] 4.2 Run targeted auth-related tests and a build/typecheck pass, then fix any issues needed to keep the change shippable.
