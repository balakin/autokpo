## Why

The year selector in the "Nova knjiga" modal uses an arbitrary range of `(currentYear − 10)` to `(currentYear + 1)`. This is loosely justified by the Pravilnik being in force since 2005, but doesn't actually enforce that bound — it just drifts with the current year. Users who need older years (e.g. 2005–2015 when opening a book in 2026) are blocked, while future years that will never be used are offered. Additionally, the field starts empty every time, forcing users to pick the current year — by far the most common choice — manually.

## What Changes

- Replace the year-range constants (`YEAR_RANGE_PAST = 10`, `YEAR_RANGE_FUTURE = 1`) with a bounded range from the Pravilnik's effective year (2005) up to the current year. No future years.
- Pre-select the current year as the default value in the year selector.
- If the current year is already occupied by an existing book, fall back to an empty (no selection) default value.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `book-library`: Year options and default selection logic in the add-book modal change from an arbitrary range + no default to a Pravilnik-bounded range + smart default.

## Impact

- `src/books/add-book-modal.tsx` — year range computation, default value, and related constants
- `src/constants.ts` — new `KPO_FIRST_YEAR` constant (Pravilnik effective year)
- `src/books/__tests__/add-book-modal.spec.tsx` — test updates for new year range and default behavior
