## Why

The codebase has 18 ESLint warnings across 15 files from the `@eslint-react` plugin, introduced when the plugin was recently added. These warnings flag React 19 idiom mismatches and purity violations that should be resolved to keep the lint baseline clean.

## What Changes

- Replace `useContext(Ctx)` with `use(Ctx)` in all hook/component files (10 occurrences across 10 files)
- Replace `<Context.Provider>` with `<Context>` in `books-provider.tsx` (React 19 pattern)
- Move `new Date()` calls out of render in `add-book-modal.tsx` and `use-stats.ts` (purity violations)
- Fix array-index key usage in `top-bar.tsx` and `stepper-root.tsx`
- Rename state setter in `theme-provider.tsx` to follow `setX` convention
- Replace `Children.toArray` in `stepper-root.tsx` with a non-legacy alternative

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `eslint-tooling`: Extend the pass condition to require zero warnings in addition to zero errors

## Impact

- 15 source files in `apps/app/src/` modified
- No API, dependency, or behavioral changes — purely internal code quality fixes
