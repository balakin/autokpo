## Why

The app currently splits date logic between `date-fns` and `@internationalized/date`, which increases dependency surface area and creates two parallel date models. Since `@internationalized/date` is already required by HeroUI, consolidating on it reduces maintenance overhead and keeps date handling consistent across the product.

## What Changes

- Remove `date-fns` from `apps/app` dependencies.
- Replace all runtime `date-fns` usage with `@internationalized/date` and platform `Intl` APIs where appropriate.
- Standardize calendar arithmetic and date comparisons on `CalendarDate`-based logic for ISO date strings used by entries and stats windows.
- Preserve existing user-visible behavior for settings sync timestamps and existing validation/statistics semantics.
- Update related tests to validate behavior after dependency consolidation.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `settings`: Sync status timestamp rendering no longer depends on `date-fns` locale utilities and uses consolidated date formatting logic while preserving locale-correct output.
- `entry-management`: Entry date validation and book-year boundary checks move from `date-fns` helpers to `@internationalized/date`-based comparisons without changing validation rules.
- `income-stats`: Rolling 12-month window calculations and date boundary handling are implemented without `date-fns`, preserving existing inclusion semantics and edge-case behavior.

## Impact

- Affected code: `apps/app/src/settings/last-successful-sync-status.tsx`, `apps/app/src/entries/entries-schema.ts`, `apps/app/src/stats/compute.ts`, related tests.
- Dependencies: remove `date-fns` from `apps/app/package.json`; keep `@internationalized/date` as the single date utility dependency.
- Risk areas: locale-sensitive relative/absolute timestamp labels and month-boundary arithmetic in rolling windows.
