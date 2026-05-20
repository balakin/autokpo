## Why

When a user signs up with email OTP and later tries to sign in with Google (same email), better-auth's default behavior is undefined without explicit configuration — it may silently create a duplicate account or produce a confusing error. Disabling account linking now, with a clear user-facing error, prevents data loss and confusion until an explicit linking UI is built.

## What Changes

- Explicitly disable account linking in better-auth config (`accountLinking: { enabled: false }`)
- Handle the `account_not_linked` error code (or equivalent) in the OAuth callback UI with a message that explains the situation and points the user to email sign-in
- No UI for linking providers is introduced — that is a future change

## Capabilities

### New Capabilities

- `social-auth-collision`: What happens when a social sign-in collides with an existing email-OTP account — block with a clear, actionable error message

### Modified Capabilities

- `user-auth`: The OAuth callback error handling gains a new recognized error code and messaging

## Impact

- `apps/app/worker/auth-options.ts` — add `accountLinking: { enabled: false }`
- `apps/app/src/auth/oauth-callback.tsx` — handle the collision error code with specific copy
- `apps/app/src/auth/__tests__/oauth-callback.spec.tsx` — test the new error case
- No database migrations, no API changes, no new dependencies
