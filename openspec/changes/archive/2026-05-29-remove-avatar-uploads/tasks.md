## 1. Worker: Remove avatar routes and R2 infrastructure

- [x] 1.1 Remove `r2_buckets` blocks from `wrangler.jsonc` (dev + production env)
- [x] 1.2 Remove `/avatars/*` from `assets.run_worker_first` in `wrangler.jsonc`
- [x] 1.3 Regenerate worker types: `pnpm generate:worker-types`
- [x] 1.4 Delete `worker/routes/avatars.ts`
- [x] 1.5 Delete `worker/avatar-storage.ts`
- [x] 1.6 Remove `avatarsRouter` import and `app.route('/', avatarsRouter)` mount from `worker/main.ts`

## 2. Worker: Decouple auth from avatar import

- [x] 2.1 Remove `AvatarImportOptions` type from `worker/auth-options.ts`
- [x] 2.2 Remove `avatarImportConfig` param from `AuthOptionsInput` in `worker/auth-options.ts`
- [x] 2.3 Remove `user.additionalFields` (`imageStatus`, `pendingAvatarUrl`) from auth config in `worker/auth-options.ts`
- [x] 2.4 Remove `user.create` before/after hooks (pending avatar import flow) from `worker/auth-options.ts`
- [x] 2.5 Remove `deleteUser.afterDelete` R2 cleanup from `worker/auth-options.ts`
- [x] 2.6 Remove `avatarImportConfig` property from `getAuthOptions()` call in `worker/auth.ts`
- [x] 2.7 Remove unused imports (`importPendingAvatar`, `publicPathToAvatarKey`) from `worker/auth.ts`

## 3. Worker: DB schema migration

- [x] 3.1 Remove `imageStatus` line from `worker/db/schema/auth.ts`
- [x] 3.2 Remove `pendingAvatarUrl` line from `worker/db/schema/auth.ts`
- [x] 3.3 Run `pnpm db:generate` to create migration
- [x] 3.4 Run `pnpm db:migrate:local` to apply migration locally

## 4. Client: Remove avatar upload/remove API

- [x] 4.1 Remove `uploadProfileImage()` and `removeProfileImage()` functions from `src/settings/account-settings-api.ts`
- [x] 4.2 Remove `image` and `imageStatus` from `AccountProfile` interface in `src/settings/account-settings-api.ts`

## 5. Client: Update account settings page

- [x] 5.1 Remove avatar picker file input and associated handler logic from `src/settings/account-settings-page.tsx`
- [x] 5.2 Remove crop modal component and crop state from settings page
- [x] 5.3 Remove avatar remove action from settings page
- [x] 5.4 Add Tooltip wrapping the avatar in settings page with message "Promena avatara trenutno nije dostupna" (i18n key, translated in all locales)

## 6. Client: Strip avatar fields from auth state

- [x] 6.1 Remove `image` and `imageStatus` from `StoredSession` type in `src/auth/auth-session.ts`
- [x] 6.2 Remove `image`/`imageStatus` from `readStoredSession()` and `writeStoredSession()` in `src/auth/auth-session.ts`
- [x] 6.3 Remove `image`/`imageStatus` assignment in `refreshSession()` in `src/auth/auth-session.ts`
- [x] 6.4 Remove `caches.delete('avatars')` from `logoutSession()` in `src/auth/auth-session.ts`
- [x] 6.5 Remove `imageStatus` from `AuthContextType` or equivalent in `src/auth/auth-context.ts`
- [x] 6.6 Remove `imageStatus` from auth client schema in `src/auth/auth-client.ts`
- [x] 6.7 Remove `imageStatus === 'importing'` polling logic from `src/auth/auth-provider.tsx`

- [x] 7.1 Remove `image` prop usage from `UserAvatar` in `src/auth/profile-popover.tsx` (pass null or remove prop)
- [x] 7.2 Remove `image` prop usage from avatar in `src/e2ee/encryption-profile-popover.tsx`

## 8. Tests: Remove avatar-related test code

- [x] 8.1 Delete `worker/__tests__/avatars.spec.ts`
- [x] 8.2 Remove avatar upload/crop/remove test cases from `src/settings/__tests__/settings-page.spec.tsx`
- [x] 8.3 Remove `imageStatus === 'importing'` polling test cases from `src/auth/__tests__/auth-provider.spec.tsx`
- [x] 8.4 Remove `imageStatus`/importing test cases from `src/auth/__tests__/auth-session.spec.tsx`
- [x] 8.5 Update `src/auth/__tests__/user-avatar.spec.tsx` to verify initials-only behavior (no image rendering)

## 9. Internationalization

- [x] 9.1 Add "Promena avatara trenutno nije dostupna" as a new translatable message in settings page
- [x] 9.2 Run `pnpm i18n:extract` to update `.po` files
- [x] 9.3 Fill English translation: "Changing avatar is not available right now"
- [x] 9.4 Fill Russian translation: "Смена аватара сейчас недоступна"

## 10. Verification

- [x] 10.1 Run `pnpm -s eslint apps/app --fix` and fix any lint errors
- [x] 10.2 Run `pnpm -s prettier --write --log-level=error apps/app`
- [x] 10.3 Run typecheck: `cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:' | head -40`
- [x] 10.4 Run tests: `cd apps/app && pnpm -s test --reporter=verbose | tail -n 120`
- [x] 10.5 Run `pnpm check:worker-types` to verify types match after regeneration
