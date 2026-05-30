## 1. Social Provider Configuration

- [ ] 1.1 Add `mapProfileToUser: () => ({ name: "", image: null })` to Google provider config
- [ ] 1.2 Add `overrideUserInfoOnSignIn: false` to Google provider config
- [ ] 1.3 Add `disableDefaultScope: true` and `scope: ["openid", "https://www.googleapis.com/auth/userinfo.email"]` to Google provider config
- [ ] 1.4 Add `disableIdTokenSignIn: true` to Google provider config
- [ ] 1.5 Add `mapProfileToUser: () => ({ name: "", image: null })` to GitHub provider config
- [ ] 1.6 Add `overrideUserInfoOnSignIn: false` to GitHub provider config

## 2. Account Config

- [ ] 2.1 Add `updateAccountOnSignIn: false` to `account` config
- [ ] 2.2 Add `storeStateStrategy: "cookie"` to `account` config

## 3. Database Hook

- [ ] 3.1 Add `databaseHooks.account.create.before` whitelist hook keeping only `{ id, accountId, providerId, userId, createdAt, updatedAt }`

## 4. Verification

- [ ] 4.1 Run tests to confirm no regressions
