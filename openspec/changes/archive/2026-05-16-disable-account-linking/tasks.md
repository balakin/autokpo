## 1. Backend config

- [x] 1.1 Add `account: { accountLinking: { enabled: false } }` to the return value of `getAuthOptions()` in `apps/app/worker/auth-options.ts`

## 2. OAuth callback UI

- [x] 2.1 Add a recognized-error map in `apps/app/src/auth/oauth-callback.tsx` that maps `account_not_linked` to a localized message explaining that an account with that email already exists and directing the user to sign in via email code
- [x] 2.2 Render the localized message for `account_not_linked` instead of the raw code string; keep the back-to-sign-in button pointing to `/sign-in`

## 3. Tests

- [x] 3.1 Add a test in `apps/app/src/auth/__tests__/oauth-callback.spec.tsx` for the `account_not_linked` error code — verify the collision message is shown and the raw code is not the primary content
