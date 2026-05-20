## 1. Schema fixes (`entries-schema.ts`)

- [x] 1.1 Add a `parseDate` validity refine after the regex check in `datumPrometaSchema` that rejects impossible calendar dates (e.g., `2025-02-30`) with "Neispravan format datuma"
- [x] 1.2 Reorder the boundary refines in `datumPrometaSchema` to: `isBeforeBookYear` → `isAfterBookYear` → `isFutureDate`

## 2. Form fixes (`entry-form.tsx`)

- [x] 2.1 Wrap `belgradeToday()` in `useState` so `today` is captured once on mount and is referentially stable
- [x] 2.2 Replace `isDateUnavailable` on `Calendar` with `minValue={startOfYear}` and `maxValue` set to the earlier of `today` and `endOfYear`
- [x] 2.3 Remove the now-unused `isDateUnavailable` prop and its inline function

## 3. Tests (`entries-schema.spec.ts`)

- [x] 3.1 Add test cases for impossible calendar dates: `2025-02-30`, `2025-04-31`, `2025-13-01` — each should fail with "Neispravan format datuma"
- [x] 3.2 Add a test for the refine priority: a date that is both after the book year and in the future should produce "Datum mora biti u godini knjige" as the first error

## 4. Book year from CRDT (`working-layout.tsx`, `entry-modal.tsx`, `entries-table.tsx`)

- [x] 4.1 Add `bookSelectors.year` selector to `book-selectors.ts` returning `number | null` for a given bookId
- [x] 4.2 Replace hardcoded `CURRENT_YEAR` in `WorkingLayout` with `useYDoc(bookSelectors.year(bookId))`; add `if (year === null) return null` guard
- [x] 4.3 Refactor `EntryModal` and `EntriesTable` to accept `year: number` directly instead of `book?: Book`
