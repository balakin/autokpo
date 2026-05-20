## Why

Users can only sign in with Google, which excludes developers who prefer GitHub identity. Adding GitHub OAuth alongside Google — using the same better-auth social provider model — expands the auth surface with minimal new complexity.

## What Changes

- Add GitHub as a second social sign-in provider in better-auth (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` env bindings).
- **BREAKING**: Change the social auth callback path from `/sign-in/social/callback` to `/sign-in/oauth/:provider/callback`, giving each provider its own route (`/sign-in/oauth/google/callback`, `/sign-in/oauth/github/callback`).
- Unify the callback error UI: collapse `error` and `missing-session` states into a single `{ status: 'error'; code: string }` shape, where missing-session uses the synthetic code `missing_session`.
- Display the provider name (Google / GitHub) in the failure heading so the user knows which flow failed.
- Add a GitHub sign-in button to the `/sign-in` entry screen.

## Capabilities

### New Capabilities

_(none — GitHub OAuth is an extension of the existing social auth capability, not a new capability)_

### Modified Capabilities

- `user-auth`: callback path changes from `/sign-in/social/callback` to `/sign-in/oauth/:provider/callback`; error UI collapses to a single provider-aware code-bearing state; GitHub added as a supported social provider; auth entry exposes GitHub sign-in action.

## Impact

- **Worker**: `auth-options.ts` gains `github` social provider; `auth.ts` reads `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` from `env`; `wrangler.jsonc` gains GitHub env bindings; `worker-configuration.d.ts` regenerated.
- **Frontend**: `auth-session.ts` (`signInSession` gains `provider` param, callback URLs updated); `auth-context.ts` / `auth-provider.tsx` / `use-auth.ts` (provider forwarded through context); `auth-entry.tsx` (GitHub button added); `router.tsx` (parameterized callback route); `social-auth-callback.tsx` (provider-aware error UI, unified error state).
- **Tests**: `social-auth-callback.spec.tsx`, `auth-entry.spec.tsx`, `auth-provider.spec.tsx` updated to cover new routes and provider param.
- **i18n**: New and changed UI strings extracted and translated (`sr-Latn`, `en`, `ru`).
- **No DB migration** required — better-auth stores GitHub accounts in the same `account` table.
