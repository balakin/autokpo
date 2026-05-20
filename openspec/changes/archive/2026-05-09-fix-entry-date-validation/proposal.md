## Why

The entry date picker has several bugs that together make it broken for past-year books: the calendar opens on the current month (showing all dates grayed out), date navigation is unconstrained, impossible calendar dates like `2025-02-30` silently pass schema validation, and the book year was hardcoded to the current year in `WorkingLayout` — meaning editing a 2024 entry always validated and constrained the calendar as if it were a 2026 book.

## What Changes

- Replace `isDateUnavailable` on the Calendar with `minValue`/`maxValue` props so the calendar opens at the correct year, restricts navigation to the valid range, and removes the need for per-date filtering
- Stabilize `today` in `EntryForm` with `useState` so the valid range doesn't shift mid-session and the `isDateUnavailable` callback (or its replacement) is referentially stable across re-renders
- Add a `parseDate` validity refine to `datumPrometaSchema` after the regex check so impossible dates like `2025-02-30` are rejected rather than silently accepted
- Reorder the date refines in `datumPrometaSchema` to: `isBeforeBookYear` → `isAfterBookYear` → `isFutureDate`, so year-boundary errors take priority over the generic future-date message
- Replace the hardcoded `CURRENT_YEAR` constant in `WorkingLayout` with a `bookSelectors.year` CRDT selector so the real book year is always used; refactor `EntryModal` and `EntriesTable` to accept `year: number` directly instead of a partial `Book` object; guard against the `null` case with an early return

## Capabilities

### New Capabilities

_None — all changes are fixes to existing behavior._

### Modified Capabilities

- `entry-management`: date validation rules change (impossible dates now rejected; refine priority changes) and the calendar UI behavior changes (opens at correct year, navigation constrained)

## Impact

- `apps/app/src/entries/entries-schema.ts` — schema changes
- `apps/app/src/entries/entry-form.tsx` — calendar props and `today` stabilization
- `apps/app/src/entries/__tests__/entries-schema.spec.ts` — new test cases for impossible dates
- `apps/app/src/entries/entry-modal.tsx` — `book?: Book` → `year: number`
- `apps/app/src/entries/entries-table.tsx` — `book?: Book` → `year: number`
- `apps/app/src/books/book-selectors.ts` — new `year` selector
- `apps/app/src/working-layout/working-layout.tsx` — replaced `CURRENT_YEAR` with CRDT selector; added null guard
