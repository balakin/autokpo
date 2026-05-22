## 1. Help page layout reflow

- [x] 1.1 Move Licenca card from row 3 (3-col grid) to a new row 4 (2-col grid) in `src/help/help-page.tsx`
- [x] 1.2 Change row 3 from `sm:grid-cols-3` to `sm:grid-cols-2` (now only Doprinesite + Autori)
- [x] 1.3 Add new row 4 with `sm:grid-cols-2` grid containing Licenca + Šifrovanje cards

## 2. Šifrovanje card

- [x] 2.1 Add `LuKeyRound` to lucide imports in `src/help/help-page.tsx`
- [x] 2.2 Create the Šifrovanje card following the existing Card.Header + Card.Content pattern
- [x] 2.3 Write sr-Latn body text naming Argon2id and AES-256-GCM, stating server cannot read data

## 3. i18n

- [x] 3.1 Wrap card title and body in `<Trans>` macros
- [x] 3.2 Run `pnpm -s i18n:extract` to update .po files
- [x] 3.3 Fill in `en` and `ru` translations for the new messages

## 4. Tests

- [x] 4.1 Update test assertions for section count (6 → 7) in `src/help/__tests__/help-page.spec.tsx`
- [x] 4.2 Add test scenario for the encryption card (algorithm names present, zero-knowledge text, LuKeyRound icon)
- [x] 4.3 Verify layout assertions match the new 4-row structure

## 5. Verify

- [x] 5.1 Run typecheck and lint on the changed files
- [x] 5.2 Run help page tests
