## Context

better-auth v1.6.11 social OAuth stores data in three places during a login flow:

1. **`verification` table** — ephemeral OAuth state row (written on `/sign-in/social`, deleted on callback)
2. **`account` table** — identity link + all OAuth tokens (`access_token`, `refresh_token`, `id_token`, `scope`, expiry fields)
3. **`user` table** — profile data including `name` and `image` populated from provider

None of the OAuth tokens or profile fields are read by the application. `getSession()` only reads `session.user.id`. The `getAccessToken`, `accountInfo`, and `refreshToken` endpoints that consume stored tokens are not used.

All database writes in better-auth go through `createWithHooks`/`updateWithHooks`, making `databaseHooks` the only intercept point for token writes.

## Goals / Non-Goals

**Goals:**

- Store only what the app actually uses: email, provider ID, account link IDs
- Eliminate OAuth tokens from the database entirely
- Strip name and image from provider profile mapping
- Remove ephemeral `verification` rows during OAuth flows
- Minimize Google OAuth scopes at the wire level
- Close unused attack surfaces (One Tap)

**Non-Goals:**

- Schema migration — no column removal; token columns remain nullable, just always null
- Changes to email OTP flow — `verification` table still used for OTP
- Changes to session behavior or session data
- Preventing better-auth from requesting tokens from providers (it always will internally)

## Decisions

### 1. `databaseHooks` whitelist over blacklist

**Decision**: Use `account.create.before` with an explicit allowlist `{ id, accountId, providerId, userId, createdAt, updatedAt }` rather than nulling individual fields.

**Rationale**: A whitelist is future-proof — any token field better-auth adds in a future version is dropped automatically. A blacklist requires updating the hook whenever better-auth's account schema grows.

**Alternative considered**: `encryptOAuthTokens: true` as a safety net alongside nulling. Rejected — unnecessary complexity when the whitelist already drops unknown fields entirely.

### 2. `updateAccountOnSignIn: false` alongside the create hook

**Decision**: Set `account.updateAccountOnSignIn: false` in addition to the `create.before` hook.

**Rationale**: `databaseHooks.account.create.before` only fires on `createOAuthUser`. On every subsequent re-login, better-auth calls `updateAccount(linkedAccount.id, freshTokens)` which goes through `updateWithHooks` — a separate code path. Without `updateAccountOnSignIn: false`, token re-writes on re-login bypass the create hook entirely. The flag suppresses the `updateAccount` call, eliminating the need for an `update.before` hook.

### 3. `storeStateStrategy: "cookie"` over database

**Decision**: Use encrypted-cookie strategy for OAuth state.

**Rationale**: Eliminates 3 DB round-trips per OAuth flow (write/read/delete to `verification` table). The encrypted payload contains no PII — only flow control data (callbackURL, codeVerifier, timestamps). Cookie lives 10 minutes, deleted after callback. No functional difference to the user.

### 4. `mapProfileToUser` returns empty/null for name and image

**Decision**: `mapProfileToUser: () => ({ name: "", image: null })` on both providers.

**Rationale**: The `user` table has `name NOT NULL` (SQLite constraint), so `null` would fail. Empty string is the minimal compliant value. `image` is nullable so `null` is correct. `overrideUserInfoOnSignIn: false` ensures this mapping does not re-run on subsequent logins (no accidental overwrites of user-set data).

**Alternative considered**: DB migration to make `name` nullable. Rejected — SQLite requires table recreation for column type changes; the empty string approach achieves the same result with zero migration risk.

### 5. Google minimal scopes + `disableIdTokenSignIn`

**Decision**: `disableDefaultScope: true` + `scope: ["openid", "https://www.googleapis.com/auth/userinfo.email"]`, and `disableIdTokenSignIn: true`.

**Rationale**: Default Google scopes include `profile` which causes Google to return `name` and `picture` in the ID token. Removing `profile` from the wire means Google never sends this data. `disableIdTokenSignIn` closes the One Tap / direct client ID token submission path — this flow is not used anywhere in the codebase.

**Note**: GitHub scopes (`read:user`, `user:email`) cannot be reduced further because `getUserInfo` hardcodes `/user` API calls regardless of scope. `read:user` is the minimum needed to get the user's numeric ID for `accountId`.

## Risks / Trade-offs

**If better-auth adds required fields to `account.create`** → The whitelist hook drops them, potentially breaking account creation. Mitigation: monitor better-auth changelog on upgrades; the hook is easy to audit.

**`name: ""` stored for all social users** → If the app later displays `user.name`, it shows blank for all social sign-in users. Mitigation: the app currently does not display `user.name` from the session; this is acceptable and expected.

**`updateAccountOnSignIn: false` prevents token refresh** → If the app ever needs fresh OAuth tokens (e.g. to call Google APIs on behalf of the user), stored tokens will be stale. Mitigation: the app does not use OAuth tokens; this is intentional.

## Migration Plan

1. Deploy `auth-options.ts` changes — no DB migration needed
2. Existing rows in `account` table retain their current token values (historical data); only new logins produce null tokens
3. No rollback complexity — reverting `auth-options.ts` restores previous behavior

## Open Questions

None — all decisions resolved during exploration.
