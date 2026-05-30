## 1. Social Provider Configuration

- [x] 1.1 Add `mapProfileToUser: () => ({ name: "", image: null })` to Google provider config
- [x] 1.2 Add `overrideUserInfoOnSignIn: false` to Google provider config
- [x] 1.3 Add `disableDefaultScope: true` and `scope: ["openid", "https://www.googleapis.com/auth/userinfo.email"]` to Google provider config
- [x] 1.4 Add `disableIdTokenSignIn: true` to Google provider config
- [x] 1.5 Add `mapProfileToUser: () => ({ name: "", image: null })` to GitHub provider config
- [x] 1.6 Add `overrideUserInfoOnSignIn: false` to GitHub provider config

## 2. Account Config

- [x] 2.1 Add `updateAccountOnSignIn: false` to `account` config
- [x] 2.2 Add `storeStateStrategy: "cookie"` to `account` config

## 3. Database Hook

- [x] 3.1 Add `databaseHooks.account.create.before` hook explicitly nulling all token fields (`accessToken`, `refreshToken`, `idToken`, `scope`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`)

## 4. Account Export

- [x] 4.1 Remove `name` and `image` from `AccountExport` interface and `buildAccountExport` output
- [x] 4.2 Change `providers` from `string[]` to `{ name: string; id: string }[]` including `accountId` from each linked account
- [x] 4.3 Update export tests to match new structure
- [x] 4.4 Update `account-export` spec to reflect new JSON shape

## 5. Verification

- [x] 5.1 Run tests to confirm no regressions
