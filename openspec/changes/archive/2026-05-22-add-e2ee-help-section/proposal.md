## Why

Users entrust financial data to AutoKPO. The app already implements end-to-end encryption (master key wrapping, sync encryption, encrypted local cache), but this is invisible — nowhere in the UI does the user learn that their data is protected or what algorithms secure it. Adding a concise security section to the help page builds trust and transparency.

## What Changes

- Add a "Šifrovanje" card to the help page describing the E2EE architecture
- Reflow the help page layout from 3-row to 4-row grid
- Move the "Licenca" card from row 3 to row 4 alongside the new "Šifrovanje" card
- Row 3 becomes a clean 2-column row ("Doprinesite projektu" + "Autori")

## Capabilities

### Modified Capabilities

- `help-page`: Add a "Šifrovanje" section describing the encryption algorithms (Argon2id, AES-256-GCM) and zero-knowledge property. Rearrange card grid layout.

## Impact

- Affected code: `src/help/help-page.tsx` (layout and new card), `src/help/__tests__/help-page.spec.tsx` (updated assertions)
- Affected specs: `openspec/specs/help-page/spec.md` (delta for layout change and new section)
- New i18n messages: card title, body text (source locale `sr-Latn`, translations needed for `en`, `ru`)
