## 1. Session Storage Consolidation

- [x] 1.1 Replace `readStoredUserId` / `writeStoredUserId` in `auth-session.ts` with `readStoredSession` / `writeStoredSession` using the `autokpo:session` JSON key `{ userId, email, image }`
- [x] 1.2 Add migration logic in `readStoredSession`: if `autokpo:session` is absent but `autokpo:remembered-local-user` exists, migrate atomically and remove the legacy key
- [x] 1.3 Update `refreshSession` to write `email` and `image` from `session.data.user` into `autokpo:session`
- [x] 1.4 Update `logoutSession` to remove `autokpo:session` instead of `autokpo:remembered-local-user`
- [x] 1.5 Update `SignedOutCleaner` to clear `autokpo:session` instead of `autokpo:remembered-local-user`

## 2. AuthContext Extension

- [x] 2.1 Replace `userId` with `user: { id, email, image } | null` in `AuthContextValue` in `auth-context.ts`
- [x] 2.2 Update `AuthProvider` to initialise `user` from `readStoredSession()` on mount and update it after `refreshSession()` resolves
- [x] 2.3 Update `storage` event listener in `AuthProvider` to re-read `user` when `autokpo:session` changes
- [x] 2.4 Update all tests for `AuthProvider`, `auth-session`, and `useAuth` to use the new session shape

## 3. Avatar Component

- [x] 3.1 Create `src/auth/user-avatar.tsx` — renders avatar image when `image` is set, falls back to an initials circle (first character of email, uppercased)
- [x] 3.2 Implement deterministic color selection: hash `userId` into an index over a fixed palette of background colors
- [x] 3.3 Write unit tests for the avatar fallback and color derivation logic

## 4. Online/Offline Hook

- [x] 4.1 Create `src/hooks/use-online.ts` — returns `boolean` from `navigator.onLine`, subscribes to `window` `online` / `offline` events

## 5. Profile Popover

- [x] 5.1 Create `src/auth/profile-popover.tsx` — three sections: identity (avatar + email/user id), status (online indicator + dirty state), sign-out
- [x] 5.2 Implement the online/offline status row using `useOnline()`
- [x] 5.3 Implement sync status row using `useSyncMetadata(s => s.dirty)`
- [x] 5.4 Implement sign-out button: disabled when offline with inline warning message; calls logout directly when online + clean; opens confirmation modal when online + dirty
- [x] 5.5 Create confirmation modal component (or inline modal) with unsynced-changes warning
- [x] 5.6 Run `i18n:extract` and fill in translations for all new strings in `en` and `ru` locales

## 6. Top Bar Integration

- [x] 6.1 Add `UserProfileButton` to `TopBar` in `src/app-shell/top-bar.tsx` as the rightmost element, outside the `portalRef` div, with responsive desktop popover/mobile drawer profile panel
- [x] 6.2 Verify the button stays rightmost when `TopBarActionsSlot` renders page actions (Books, WorkingLayout pages)

## 7. Settings Page Cleanup

- [x] 7.1 Remove the sign-out `Button` from the Data card in `src/settings/settings-page.tsx`
- [x] 7.2 Update settings page tests to assert sign-out button is absent

## 8. End-to-End Verification

- [x] 8.1 Run full test suite and fix any failures (`cd apps/app && pnpm -s test --reporter=verbose | tail -n 120`)
- [x] 8.2 Run typecheck and resolve all errors (`cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:' | head -n 40`)
- [x] 8.3 Run lint and prettier (`pnpm -s eslint apps/app --fix` and `pnpm -s prettier --cache --write apps/app`)
