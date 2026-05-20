## Why

AutoKPO holds personal data on behalf of users — account information server-side and tax book content locally — and GDPR (Articles 15 and 20) requires that users can receive a copy of all data held about them in a structured, machine-readable format. Adding data export fulfills this legal obligation and gives users confidence their data is portable.

## What Changes

- Remove the disabled "Uvezi podatke" and "Obriši sve podatke" buttons from the "Podaci" card in general settings (not being implemented)
- Wire up the existing disabled "Izvezi podatke" button in general settings to export local app state (books, entries, profiles, signatures) as a JSON file — works offline
- Add a new "Vaši podaci" card to the account settings page with an "Izvezi podatke naloga" button that exports server-side account information as a JSON file — requires an internet connection

## Capabilities

### New Capabilities

- `state-export`: Client-side export of the full Y.Doc contents (books, entries, entity profiles, signatures, locale) to a downloadable JSON file; works offline; file named `autokpo-state-YYYY-MM-DD.json`
- `account-export`: Client-side export of server account data (name, email, emailVerified, image, createdAt, OAuth providers) to a downloadable JSON file; requires online; file named `autokpo-account-YYYY-MM-DD.json`

### Modified Capabilities

- `settings`: Remove two placeholder buttons ("Uvezi podatke", "Obriši sve podatke") from the general settings data card

## Impact

- `src/settings/general-settings-page.tsx` — wire up state export button, remove two unimplemented buttons
- `src/settings/account-settings-page.tsx` — add new "Vaši podaci" card with account export
- `src/settings/account-settings-api.ts` — add `fetchAccountExport` function using `authClient.getSession()` and `authClient.listAccounts()`
- New module `src/settings/export.ts` — shared download helper and state export logic (reads Y.Doc)
- No new server endpoints, no new DB migrations, no new dependencies
