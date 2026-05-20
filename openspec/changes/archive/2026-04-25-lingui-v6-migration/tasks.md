## 1. Package Upgrades

- [x] 1.1 Upgrade `@lingui/core` and `@lingui/react` from `^5.9.5` to `^6.0.0` in dependencies
- [x] 1.2 Upgrade `@lingui/cli`, `@lingui/vite-plugin`, and `@lingui/babel-plugin-lingui-macro` from `^5.9.5` to `^6.0.0` in devDependencies
- [x] 1.3 Verify all `@lingui/vite-plugin` v6 peer dependencies (`@babel/core`, `@lingui/babel-plugin-lingui-macro`, `@rolldown/plugin-babel`, `rolldown`) are present as explicit devDependencies
- [x] 1.4 Run `pnpm install` and resolve any `ERESOLVE` peer dependency errors

## 2. Build Pipeline Verification

- [x] 2.1 Verify `vite.config.ts` keeps `@lingui/babel-plugin-lingui-macro` as a Babel plugin (not converting to `linguiTransformerBabelPreset()`)
- [x] 2.2 Verify `@lingui/vite-plugin` v6 options (`failOnMissing`, `failOnCompileError`) still work with the same config shape
- [x] 2.3 Verify `lingui.config.ts` is compatible with v6 (no removed options like `format: "po"` string, `extractorParserOptions`, etc.)
- [x] 2.4 Confirm `compileNamespace: 'es'` still works or adjust if v6 drops it (ESM-only default may make it redundant)

## 3. Catalog Re-extraction & Translation Audit

- [x] 3.1 Run `pnpm i18n:extract` to regenerate all PO catalogs with URL-safe Base64 message IDs
- [x] 3.2 Review the diff of `src/locales/sr-Latn.po`, `src/locales/en.po`, and `src/locales/ru.po` — verify no translations were lost and all ID changes are URL-safe Base64 substitutions (`+` → `-`, `/` → `_`, `=` removed)
- [x] 3.3 Fill in any empty `msgstr` entries in `en.po` and `ru.po` that may have emerged from re-extraction
- [x] 3.4 Commit the updated PO catalogs

## 4. Typecheck & Build Verification

- [x] 4.1 Run `pnpm build` and verify TypeScript compilation succeeds (watch for `null` → `undefined` breaking changes in Lingui types)
- [x] 4.2 Run `pnpm test` and verify all tests pass
- [x] 4.3 Run `pnpm dev` and verify HMR, locale switching, and catalog compilation work correctly

## 5. Lint & ESLint Warnings Resolution

- [x] 5.1 Run `pnpm lint` and verify the 40 `import-x/no-deprecated` warnings for `@lingui/core/macro` and `@lingui/react/macro` imports are resolved
- [x] 5.2 If warnings persist with v6, investigate whether the `/macro` subpath exports have changed and update import patterns if needed
- [x] 5.3 Verify `eslint-plugin-lingui` rules still function correctly with v6 packages
- [x] 5.4 Run `pnpm lint:fix` and `pnpm lint` to confirm clean output

## 6. Update i18n Spec

- [x] 6.1 Update `openspec/specs/i18n/spec.md` to reflect v6 package versions and URL-safe message ID format (merge delta from this change's `specs/i18n/spec.md`)
- [x] 6.2 Remove the `specs/i18n/spec.md` delta from this change after merging
