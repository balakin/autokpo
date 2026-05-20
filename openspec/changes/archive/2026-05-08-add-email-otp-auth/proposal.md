## Why

The app currently supports only Google sign-in, which is a useful baseline but leaves no simple passwordless path for users who prefer email-based access. We want a lightweight proof of concept for email one-time-code sign-in/sign-up that keeps the current local-first session model and avoids adding password management.

## What Changes

- Extend authentication to support email OTP sign-in alongside the existing Google social flow.
- Allow the same email OTP flow to cover both first-time account creation and returning-user sign-in without introducing passwords.
- Add worker-side email delivery for OTP messages using Resend while keeping Better Auth as the source of truth for OTP issuance, verification, and session creation.
- Update the signed-out auth screen to offer a simple two-step email flow: request code, then verify code.
- Preserve the existing HttpOnly cookie session model, remembered local user behavior, logout flow, and Google callback flow.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `user-auth`: add passwordless email OTP sign-in/sign-up, maintain Google sign-in, and keep the existing remembered-user and logout semantics across both auth methods.

## Impact

- Affected frontend areas: `src/auth/*` and the signed-out auth entry experience.
- Affected worker areas: `worker/auth.ts`, `worker/auth-options.ts`, Better Auth configuration, and worker env/secrets handling for outbound email delivery.
- Dependency/system impact: add Resend integration for transactional OTP email delivery and extend Better Auth client/server plugin usage for email OTP.
