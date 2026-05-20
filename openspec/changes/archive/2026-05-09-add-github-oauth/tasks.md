## 1. Worker — GitHub provider config

- [x] 1.1 Add `github` to `AuthOptionsInput` type and `socialProviders` in `worker/auth-options.ts`, mirroring the `google` field
- [x] 1.2 Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` bindings to `wrangler.jsonc`
- [x] 1.3 Pass `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` from `env` in `worker/auth.ts`, alongside existing Google credentials
- [x] 1.4 Add `github` with empty strings to `auth.config.ts` (CLI-only config)
- [x] 1.5 Run `pnpm -s generate:worker-types` and verify `worker-configuration.d.ts` contains the new GitHub bindings

## 2. Frontend — auth session and context

- [x] 2.1 Update `signInSession(provider: 'google' | 'github')` in `auth-session.ts` to accept a provider param and use `/sign-in/oauth/${provider}/callback` for both `callbackURL` and `errorCallbackURL`
- [x] 2.2 Update `AuthContext` type in `auth-context.ts`: change `signIn()` to `signIn(provider: 'google' | 'github')`
- [x] 2.3 Update `AuthProvider` in `auth-provider.tsx` to accept and forward `provider` to `signInSession`

## 3. Frontend — router

- [x] 3.1 Replace the `/sign-in/social/callback` static route in `router.tsx` with `/sign-in/oauth/:provider/callback` pointing to `SocialAuthCallback`

## 4. Frontend — callback component

- [x] 4.1 Collapse `CallbackState` in `social-auth-callback.tsx` to `{ status: 'loading' } | { status: 'error'; code: string }`, removing the `missing-session` variant
- [x] 4.2 Replace `setState({ status: 'missing-session' })` with `setState({ status: 'error', code: 'missing_session' })`
- [x] 4.3 Add `PROVIDER_NAMES` map (`google` → `'Google'`, `github` → `'GitHub'`) and read `:provider` via `useParams()`
- [x] 4.4 Update the failure heading to include the resolved provider display name (fallback to generic string if unrecognized)
- [x] 4.5 Unify the error body to always show `"Kod: {code}"` regardless of error source

## 5. Frontend — auth entry

- [x] 5.1 Add a GitHub sign-in button to `auth-entry.tsx` that calls `auth.signIn('github')`
- [x] 5.2 Update the existing Google button call to `auth.signIn('google')`

## 6. i18n

- [x] 6.1 Run `pnpm -s i18n:extract` to update `.po` catalogs with new and changed strings
- [x] 6.2 Fill in `en` and `ru` translations for: GitHub button label, updated failure heading pattern, generic fallback heading, and code display string

## 7. Tests

- [x] 7.1 Update `social-auth-callback.spec.tsx`: use `/sign-in/oauth/google/callback` route, test provider name in heading, test `missing_session` code in missing-session case, remove `missing-session` state assertions
- [x] 7.2 Update `auth-entry.spec.tsx`: add test for GitHub button calling `signIn('github')`; update Google button assertion to verify `signIn('google')` is called with the provider arg
- [x] 7.3 Update `auth-provider.spec.tsx` (or `use-auth.spec.tsx`): verify `signIn('google')` and `signIn('github')` forward the correct provider to `signInSession`
- [x] 7.4 Run full test suite and confirm no regressions: `cd apps/app && pnpm -s test --reporter=verbose | tail -n 120`
