## 1. Help page layout reflow

- [ ] 1.1 Move Licenca card from row 3 (3-col grid) to a new row 4 (2-col grid) in `src/help/help-page.tsx`
- [ ] 1.2 Change row 3 from `sm:grid-cols-3` to `sm:grid-cols-2` (now only Doprinesite + Autori)
- [ ] 1.3 Add new row 4 with `sm:grid-cols-2` grid containing Licenca + Šifrovanje cards

## 2. Šifrovanje card

- [ ] 2.1 Add `LuKeyRound` to lucide imports in `src/help/help-page.tsx`
- [ ] 2.2 Create the Šifrovanje card following the existing Card.Header + Card.Content pattern
- [ ] 2.3 Write sr-Latn body text naming Argon2id and AES-256-GCM, stating server cannot read data

## 3. i18n

- [ ] 3.1 Wrap card title and body in `<Trans>` macros
- [ ] 3.2 Run `pnpm -s i18n:extract` to update .po files
- [ ] 3.3 Fill in `en` and `ru` translations for the new messages

## 4. Tests

- [ ] 4.1 Update test assertions for section count (6 → 7) in `src/help/__tests__/help-page.spec.tsx`
- [ ] 4.2 Add test scenario for the encryption card (algorithm names present, zero-knowledge text, LuKeyRound icon)
- [ ] 4.3 Verify layout assertions match the new 4-row structure

## 5. Verify

- [ ] 5.1 Run typecheck and lint on the changed files
- [ ] 5.2 Run help page tests
