## Why

Lingui v6.0.0 is released (Apr 22, 2026) with breaking changes and the project currently depends on v5.9.5. The ESLint `import-x/no-deprecated` rule is already flagging 40 deprecation warnings against v5 imports. Upgrading aligns the project with the latest Lingui ecosystem, eliminates deprecation warnings, reduces package size (~44% smaller install), and gains new features like CLI multithreading and configurable JSX placeholder names.

## What Changes

- **BREAKING**: Upgrade all `@lingui/*` packages from v5.9.5 to v6.0.0
- **BREAKING**: Message IDs change to URL-safe Base64 encoding (`+` → `-`, `/` → `_`, remove `=` padding) — all PO catalogs must be re-extracted and translations audited
- **BREAKING**: `@lingui/vite-plugin` v6.0.0 requires Vite ≥6.3 (project is on Vite 8 — compatible)
- **BREAKING**: `@lingui/vite-plugin` v6.0.0 adds new peerDeps: `@babel/core`, `@lingui/babel-plugin-lingui-macro`, `@rolldown/plugin-babel`, `rolldown` — these must be declared in the project
- **BREAKING**: ESM-only distribution — no CJS fallback in any `@lingui/*` package
- **BREAKING**: Node.js ≥22.19+ required (project requires ≥24 — compatible)
- Update `lingui.config.ts` to use `defineConfig` from `@lingui/cli` (already using it) and verify `compileNamespace: 'es'` still works
- Resolve 40 `import-x/no-deprecated` ESLint warnings on `@lingui/core/macro` and `@lingui/react/macro` imports
- Verify `eslint-plugin-lingui@0.13.1` compatibility with Lingui v6
- Evaluate and potentially adopt `linguiTransformerBabelPreset()` from `@lingui/vite-plugin` v6 for the vite config (must verify it preserves the "macros before React Compiler" invariant)
- Re-extract all PO catalogs after upgrade and audit for message ID changes
- Run full typecheck — v6 changes `null` → `undefined` for optional values
- Consider adopting `jsxPlaceholderAttribute` / `jsxPlaceholderDefaults` for more semantic placeholder names in PO files

## Capabilities

### New Capabilities

- `lingui-v6-upgrade`: Covers the package upgrades, config changes, build pipeline updates, and catalog re-extraction required to move from Lingui v5 to v6

### Modified Capabilities

- `i18n`: The i18n infra spec must be updated to reflect v6 package versions, new vite-plugin peerDeps, potential vite config changes, and the message ID format change affecting PO catalogs

## Impact

- **Dependencies**: `@lingui/core`, `@lingui/react`, `@lingui/cli`, `@lingui/vite-plugin`, `@lingui/babel-plugin-lingui-macro` — all bumped to ^6.0.0. New peerDeps on `@lingui/vite-plugin` must be declared.
- **Build pipeline**: `vite.config.ts` may need restructuring if `linguiTransformerBabelPreset()` is adopted, or remains the same if the current plugin+preset approach is kept
- **Data**: All 3 PO catalog files (`sr-Latn.po`, `en.po`, `ru.po`) will have changed message IDs wherever auto-generated IDs contained `+`, `/`, or `=` characters. Translations must be audited for integrity.
- **Types**: Any Lingui internal types that used `null` now use `undefined` — typecheck must pass
- **ESLint**: The 40 `import-x/no-deprecated` warnings must be resolved or confirmed as no longer applicable with v6
- **Tests**: All i18n-related tests must pass with the new runtime
