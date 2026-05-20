## 1. App Identity

- [x] 1.1 Rename sidebar branding in `src/app-shell/sidebar.tsx` from "KPO" to "AutoKPO"
- [x] 1.2 Rename page title in `index.html` from "KPO" to "AutoKPO"
- [x] 1.3 Update localStorage key in `index.html` inline script from `kpo:theme` to `autokpo:theme`

## 2. localStorage Keys

- [x] 2.1 Change `STORAGE_KEY` in `src/settings/theme-provider.tsx` from `'kpo:theme'` to `'autokpo:theme'`
- [x] 2.2 Change `STORAGE_KEY` in `src/i18n/locale-provider.tsx` from `'kpo:locale'` to `'autokpo:locale'`
- [x] 2.3 Change `STORAGE_KEY` in `src/books/books-storage.ts` from `'kpo:books'` to `'autokpo:books'`

## 3. Package and Config

- [x] 3.1 Rename `"name"` in `package.json` from `"kpo"` to `"autokpo"`
- [x] 3.2 Rename `"name"` in `wrangler.jsonc` from `"kpo"` to `"autokpo"`

## 4. React Devtools Display Names

- [x] 4.1 Update stepper display names in `src/ui/stepper/stepper-root.tsx` from `KPO.Stepper` to `AutoKPO.Stepper`
- [x] 4.2 Update stepper display names in `src/ui/stepper/stepper-label.tsx` from `KPO.Stepper.Label` to `AutoKPO.Stepper.Label`
- [x] 4.3 Update stepper display names in `src/ui/stepper/stepper-step.tsx` from `KPO.Stepper.Step` to `AutoKPO.Stepper.Step`
- [x] 4.4 Update stepper display names in `src/ui/stepper/stepper-connector.tsx` from `KPO.Stepper.Connector` to `AutoKPO.Stepper.Connector`

## 5. Tests

- [x] 5.1 Update localStorage key assertions in theme-provider tests to match `'autokpo:theme'`
- [x] 5.2 Update localStorage key assertions in locale-provider tests to match `'autokpo:locale'`
- [x] 5.3 Update any test assertions referencing sidebar "KPO" text to "AutoKPO"
- [x] 5.4 Update any test assertions referencing page title "KPO" to "AutoKPO"

## 6. Documentation

- [x] 6.1 Update app name references in `AGENTS.md` from "KPO" to "AutoKPO"
- [x] 6.2 Update app name references in `CLAUDE.md`

## 7. Verification

- [x] 7.1 Run `pnpm test` and confirm all tests pass
- [x] 7.2 Run `pnpm build` and confirm the build succeeds
- [x] 7.3 Run `pnpm lint:fix` and confirm no lint errors remain
