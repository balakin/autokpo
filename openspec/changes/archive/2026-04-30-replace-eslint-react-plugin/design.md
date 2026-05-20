## Context

The repo uses `eslint-plugin-react` v7 + `eslint-plugin-react-hooks` v7 for React linting. Both were written for ESLint v8's legacy config format and require the `settings.react.version` workaround. `@eslint-react/eslint-plugin` (Rel1cx/eslint-react) is a ground-up rewrite targeting ESLint v9 flat config and React 19 — it bundles component, DOM, hooks, and naming-convention rules in one package with first-class TypeScript support.

`eslint-plugin-react-refresh` is unrelated to these two packages (it checks Vite HMR boundary constraints) and is **not** replaced.

## Goals / Non-Goals

**Goals:**

- Replace `eslint-plugin-react` and `eslint-plugin-react-hooks` with `@eslint-react/eslint-plugin`.
- Keep `eslint-plugin-react-refresh` unchanged.
- Remove the `settings.react.version: 'detect'` boilerplate.
- Ensure the lint pass remains clean (zero errors) after the swap.

**Non-Goals:**

- Enabling every new rule shipped by `@eslint-react/eslint-plugin`; use the recommended preset only.
- Changing any other part of the ESLint config (import-x, lingui, prettier, etc.).
- Fixing pre-existing non-React lint issues.

## Decisions

### Use `recommended-type-checked` preset

`@eslint-react/eslint-plugin` ships `recommended`, `recommended-type-checked`, and `all`. We use `recommended-type-checked` to match the existing type-aware posture (`tseslint.configs.recommendedTypeChecked`). It enables a small set of additional rules that use type information (e.g. accurate hooks exhaustive-deps analysis).

**Alternative considered**: plain `recommended` — rejected because we already run type-aware TypeScript rules and the incremental cost of type-checked React rules is negligible.

### Keep `eslint-plugin-react-refresh` as-is

`react-refresh` is a Vite-specific HMR boundary checker with no equivalent in `@eslint-react/eslint-plugin`. Removing it would silently allow HMR-breaking exports.

### Rule mapping strategy

`@eslint-react/eslint-plugin` uses a different rule namespace (`react/*`, `react-hooks/*`, `react-dom/*`). Old per-rule customisations in `eslint.config.ts` (currently none — only the preset extends are used) would need renaming. Since the current config carries no custom React rule overrides beyond the presets, a straight replacement of the `extends` entries is sufficient.

### Drop `settings.react.version`

`@eslint-react/eslint-plugin` auto-detects the React version from the installed `react` package; no `settings` entry is needed. Both the app-source and app-tests configs currently set `settings: { react: { version: 'detect' } }` — those blocks can be removed entirely.

## Risks / Trade-offs

- **Rule renames may produce new errors** → run `pnpm eslint apps/app` after the swap; fix any new violations before committing.
- **`recommended-type-checked` requires `parserOptions.projectService`** — already set in the base config, so no extra setup needed.
- **`eslint-plugin-react-hooks` v7 exhaustive-deps behaviour differs from `@eslint-react`'s equivalent** → review any suppressions in app source; none currently exist.
- **`@eslint-react/eslint-plugin` is actively developed and may ship breaking changes in minor versions** → pin to a patch range (`~x.y.z`) or use the exact version from `npm info`.
