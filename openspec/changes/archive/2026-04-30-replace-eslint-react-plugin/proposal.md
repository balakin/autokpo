## Why

`eslint-plugin-react` v7 is a legacy plugin designed for class components and pre-flat-config ESLint; it requires manual `settings.react.version` and ships rules that are obsolete with React 19's JSX transform. `@eslint-react/eslint-plugin` (github.com/Rel1cx/eslint-react) is built ground-up for flat config, React 19, and the new JSX transform — providing stricter, more accurate rules with less config overhead.

## What Changes

- Remove `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh` from root `devDependencies`.
- Add `@eslint-react/eslint-plugin` (includes hooks, dom, naming-convention, and debug sub-plugins bundled).
- Update `eslint.config.ts` to replace the three old plugin imports/extends with the new plugin's recommended preset.
- Remove `settings.react.version: 'detect'` (no longer needed).
- Verify no rule violations are introduced; fix any new findings.

## Capabilities

### New Capabilities

- None — this is a tooling-only change with no product capabilities.

### Modified Capabilities

- None — no spec-level behavior changes.

## Impact

- **`package.json`** (root): remove `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`; add `@eslint-react/eslint-plugin`.
- **`eslint.config.ts`** (root): replace three plugin imports and their `extends`/`settings` entries with the new plugin's flat-config presets.
- **`apps/app/src/`**: any files with existing lint suppressions tied to old rule names may need updating.
- No runtime or build changes; purely developer tooling.
