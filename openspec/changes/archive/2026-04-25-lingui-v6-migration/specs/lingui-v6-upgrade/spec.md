## ADDED Requirements

### Requirement: Lingui v6 packages are installed and compatible

The system SHALL use Lingui v6 packages: `@lingui/core@^6`, `@lingui/react@^6`, `@lingui/cli@^6`, `@lingui/vite-plugin@^6`, and `@lingui/babel-plugin-lingui-macro@^6`. The `@lingui/vite-plugin` v6 peer dependencies (`@babel/core`, `@lingui/babel-plugin-lingui-macro`, `@rolldown/plugin-babel`, `rolldown`) SHALL be satisfied as explicit devDependencies. The `eslint-plugin-lingui` package SHALL remain at v0.13.1 unless found incompatible.

#### Scenario: Package versions are correct

- **WHEN** `package.json` is inspected
- **THEN** `@lingui/core`, `@lingui/react` SHALL be `^6.0.0` in dependencies
- **AND** `@lingui/cli`, `@lingui/vite-plugin`, `@lingui/babel-plugin-lingui-macro` SHALL be `^6.0.0` in devDependencies
- **AND** all `@lingui/vite-plugin` v6 peer dependencies SHALL be resolvable from devDependencies

#### Scenario: ESLint plugin compatibility

- **WHEN** `eslint-plugin-lingui@0.13.1` is used with Lingui v6
- **THEN** the plugin SHALL work without runtime errors and existing rules SHALL function as before

### Requirement: Build pipeline preserves macro-before-compiler ordering

The vite configuration SHALL keep `@lingui/babel-plugin-lingui-macro` as an explicit Babel **plugin** and the React Compiler preset as a Babel **preset** within `@rolldown/plugin-babel`, ensuring macros expand before the React Compiler processes the code. The `@lingui/vite-plugin` SHALL be configured with `failOnMissing: true` and `failOnCompileError: true`.

#### Scenario: Plugin ordering in vite config

- **WHEN** the vite build pipeline runs
- **THEN** `@lingui/babel-plugin-lingui-macro` SHALL be listed as a babel plugin (running before presets)
- **AND** `reactCompilerPreset()` SHALL be listed as a babel preset (running after plugins)
- **AND** `@lingui/vite-plugin` SHALL apply HMR and on-the-fly catalog compilation

#### Scenario: Lingui build failures surface correctly

- **WHEN** a PO catalog has an empty `msgstr` for a key or a compilation error occurs
- **THEN** `failOnMissing: true` SHALL cause a build failure
- **AND** `failOnCompileError: true` SHALL cause a build failure

### Requirement: Message IDs use URL-safe Base64 encoding

After upgrade, `pnpm i18n:extract` SHALL produce PO catalogs where auto-generated message IDs use URL-safe Base64 (RFC 4648 Section 5) with `+` replaced by `-`, `/` replaced by `_`, and `=` padding removed. All three locale catalogs (`sr-Latn.po`, `en.po`, `ru.po`) SHALL be re-extracted and committed.

#### Scenario: Re-extracted catalogs have URL-safe IDs

- **WHEN** `pnpm i18n:extract` is run after upgrading to Lingui v6
- **THEN** auto-generated message IDs in PO files SHALL NOT contain `+`, `/`, or `=` characters
- **AND** all previously translated strings SHALL still be present (verified by diff review)

#### Scenario: No translations are lost

- **WHEN** catalogs are re-extracted
- **THEN** every `msgstr` that had a non-empty value before the upgrade SHALL have the same value after re-extraction
- **AND** the Vite plugin with `failOnMissing: true` SHALL confirm all keys have translations

### Requirement: TypeScript compilation succeeds with v6 type changes

The project SHALL compile without type errors after upgrading to Lingui v6, which changes optional value types from `null` to `undefined` in internal Lingui APIs.

#### Scenario: Typecheck passes

- **WHEN** `pnpm build` is run
- **THEN** TypeScript compilation SHALL succeed with zero errors
- **AND** no new type errors SHALL be introduced compared to the v5 build

### Requirement: ESLint deprecation warnings are resolved

After upgrading to Lingui v6, the 40 `import-x/no-deprecated` warnings on `@lingui/core/macro` and `@lingui/react/macro` imports SHALL be resolved. If v6 no longer marks these subpaths as deprecated, the warnings SHALL disappear automatically. If the import pattern has changed, all affected files SHALL be updated to the v6 pattern.

#### Scenario: No deprecated import warnings

- **WHEN** `pnpm lint` is run
- **THEN** zero `import-x/no-deprecated` warnings for `@lingui/*` imports SHALL be present
