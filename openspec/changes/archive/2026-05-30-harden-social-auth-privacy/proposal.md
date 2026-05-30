## Why

Social OAuth flows currently store unnecessary personal data (name, avatar URL) and OAuth tokens (access token, refresh token, ID token, scopes, expiry timestamps) in the database. None of this data is used by the application — storing it creates GDPR exposure and unnecessary attack surface with no functional benefit.

## What Changes

- **Google + GitHub**: `mapProfileToUser` returns `{ name: "", image: null }` — name and avatar are never written to the `user` table
- **Google + GitHub**: `overrideUserInfoOnSignIn: false` — provider profile data is not re-imported on subsequent logins
- **Google**: `disableDefaultScope: true` + minimal scope `["openid", "https://www.googleapis.com/auth/userinfo.email"]` — `profile` scope removed, reducing data sent by Google
- **Google**: `disableIdTokenSignIn: true` — One Tap / direct ID token submission path disabled (unused)
- **Account config**: `updateAccountOnSignIn: false` — prevents token re-writes to the `account` table on every re-login
- **Account config**: `storeStateStrategy: "cookie"` — OAuth state stored in an encrypted cookie instead of the `verification` table, eliminating ephemeral DB rows during every OAuth flow
- **databaseHooks**: `account.create.before` explicitly nulls all token fields (`accessToken`, `refreshToken`, `idToken`, `scope`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`) before the row is written; `encryptOAuthTokens: true` provides a safety net for any future token fields

## Capabilities

### New Capabilities

- `social-auth-data-minimization`: OAuth sign-in stores only identity-linking fields; no tokens, no profile data beyond email

### Modified Capabilities

- `user-auth`: social sign-in behavior changes — name/image are no longer populated from provider; OAuth state no longer writes to `verification` table

## Impact

- `apps/app/worker/auth-options.ts` — all changes are confined to this file
- `user` table: `name` column always `""`, `image` always `null` after social sign-in
- `account` table: token columns (`access_token`, `refresh_token`, `id_token`, `scope`, expiry fields) always `null` after any social sign-in or re-login
- `verification` table: no longer written to during OAuth flows (cookie strategy)
- No API surface changes, no client-side changes, no schema migrations required
