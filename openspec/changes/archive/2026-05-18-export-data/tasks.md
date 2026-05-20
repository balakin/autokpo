## 1. Export utilities module

- [x] 1.1 Create `src/settings/export.ts` with `downloadJson(filename, data)` helper that creates a Blob, object URL, clicks a hidden `<a>`, then revokes the URL
- [x] 1.2 Implement `buildStateExport(ydoc)` in `export.ts` — reads books map, iterates entries/profile/signature via `.toJSON()`, returns the full export object matching the state export JSON structure
- [x] 1.3 Implement `buildAccountExport()` in `export.ts` — calls `authClient.getSession()` and `authClient.listAccounts()`, assembles and returns the account export object; extracts provider IDs defensively with fallback to `[]`
- [x] 1.4 Write unit tests for `buildStateExport` with a seeded Y.Doc (empty books, one book no sub-entities, one book with profile/signature/entries)
- [x] 1.5 Write unit tests for `buildAccountExport` with mocked auth client responses (happy path, missing optional fields)

## 2. General settings — state export

- [x] 2.1 In `general-settings-page.tsx`, remove the disabled "Uvezi podatke" and "Obriši sve podatke" buttons
- [x] 2.2 Wire the "Izvezi podatke" button: call `buildStateExport(ydoc)` and `downloadJson('autokpo-state-YYYY-MM-DD.json', data)` on press; remove `isDisabled`
- [x] 2.3 Update i18n — run `pnpm i18n:extract` and fill in `en` and `ru` translations for any new or changed strings
- [x] 2.4 Update the settings spec in `openspec/specs/settings/spec.md` to remove the placeholder scenario and update the main requirement text (archive step will do this, but verify the delta matches)

## 3. Account settings — account export

- [x] 3.1 Add `fetchAccountExport` function to `account-settings-api.ts` — calls `authClient.getSession()` and `authClient.listAccounts()`, returns the account export object shape
- [x] 3.2 Add a new "Vaši podaci" `Card` to `account-settings-page.tsx` after the sessions card (inside the online branch, after `AccountSessionsCard`)
- [x] 3.3 Implement the export button inside the new card using `useMutation` for `fetchAccountExport` + `downloadJson`; show `isPending` state on the button
- [x] 3.4 Update i18n — run `pnpm i18n:extract` and fill in `en` and `ru` translations for new strings in the account export card

## 4. Verification

- [x] 4.1 Run full test suite (`cd apps/app && pnpm -s test --reporter=verbose | tail -n 120`) and fix any failures
- [x] 4.2 Run typecheck (`cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:' | head -n 40`) and fix any errors
- [x] 4.3 Run linter (`pnpm -s eslint apps/app --fix`) and formatter (`pnpm -s prettier --cache --write --log-level=error apps/app`)
