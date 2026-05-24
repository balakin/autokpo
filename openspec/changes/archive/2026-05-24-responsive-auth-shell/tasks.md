## 1. Create AuthPreferencesPopover component

- [x] 1.1 Create `src/auth/auth-preferences-popover.tsx` with the Popover (desktop) / Drawer (mobile) pattern, following `EncryptionProfilePopover` structure
- [x] 1.2 Implement gear button trigger using `LuSettings` from `react-icons/lu` with `Button isIconOnly variant="ghost" size="md"`
- [x] 1.3 Add language `<Select>` with visible `<Label>` and `<ListBox>` populated from `LOCALES`/`LOCALE_NAMES`
- [x] 1.4 Add theme `<Select>` with visible `<Label>` and `<ListBox>` with light/dark/system options
- [x] 1.5 Wire up `useLocale`, `useTheme`, and `useIsMobile` hooks
- [x] 1.6 Set desktop Popover width to `w-60` and position to `bottom end`
- [x] 1.7 Add mobile Drawer with "Podešavanja" heading and LuX close button, matching `EncryptionProfilePopover` drawer structure

## 2. Update auth shell

- [x] 2.1 Remove inline `Select`, `Label`, `ListBox`, `LOCALE_NAMES`, `LOCALES`, `useLocale`, `useTheme` imports from `auth-shell.tsx`
- [x] 2.2 Import `AuthPreferencesPopover` from `./auth-preferences-popover`
- [x] 2.3 Replace the header's select wrapper with `<AuthPreferencesPopover />` inside `flex items-center justify-end`
- [x] 2.4 Change header layout from `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between` to `flex items-center justify-between gap-3`, matching `encryption-shell.tsx`

## 3. Social buttons responsive layout

- [x] 3.1 In `auth-entry.tsx`, change the OAuth buttons container from `flex gap-2` to `flex flex-col gap-2 sm:flex-row`

## 4. Tests

- [x] 4.1 Update `__tests__/auth-shell.spec.tsx` to verify the gear button renders (remove any tests for removed inline selects if present)
- [x] 4.2 Add `__tests__/auth-preferences-popover.spec.tsx` with tests for: button renders, popover opens on desktop, drawer opens on mobile, language selection, theme selection

## 5. i18n

- [x] 5.1 Run `i18n:extract` to update `.po` files with any new translatable strings
- [x] 5.2 Fill in translations for `en` and `ru` locales for any new strings

## 6. Verify

- [x] 6.1 Run `pnpm -s build 2>&1 | grep -E 'error TS|error:' | head -n 40` to check for type/build errors
- [x] 6.2 Run `pnpm -s eslint apps/app --fix --format=json | jq '[.[] | select(.errorCount > 0)]'` to check lint
- [x] 6.3 Run `pnpm -s prettier --check --log-level=error apps/app` to check formatting
- [x] 6.4 Run `pnpm -s test --reporter=verbose | tail -n 120` to verify all tests pass
