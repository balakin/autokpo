## 1. Date utility consolidation setup

- [x] 1.1 Remove `date-fns` imports/usages from app source and tests inventory (`settings`, `entries-schema`, `stats/compute`, settings page tests)
- [x] 1.2 Add or align shared date helper utilities for `CalendarDate` parsing/comparison and calendar-month subtraction used by entry validation and stats
- [x] 1.3 Remove `date-fns` from `apps/app/package.json` and refresh lockfile

## 2. Replace settings sync timestamp formatting

- [x] 2.1 Refactor `last-successful-sync-status.tsx` absolute timestamp formatting to `Intl.DateTimeFormat` with locale mapping from app locale codes
- [x] 2.2 Refactor relative timestamp rendering to `Intl.RelativeTimeFormat` while preserving bounded refresh cadence and anti-future phrasing behavior
- [x] 2.3 Update settings sync status tests to assert expected localized relative and absolute outputs after formatter replacement

## 3. Replace entry date validation internals

- [x] 3.1 Rewrite `entries-schema.ts` date helper functions to use `@internationalized/date` calendar values for future-date and book-year bounds checks
- [x] 3.2 Preserve existing validation messages and failure conditions for empty, malformed, future, and out-of-year dates
- [x] 3.3 Add or update focused tests covering boundary dates (Jan 1, Dec 31, and "today" in Europe/Belgrade)

## 4. Replace stats date arithmetic and preserve semantics

- [x] 4.1 Refactor rolling 12-month window start calculation in `stats/compute.ts` to remove `date-fns` while keeping inclusive boundary behavior
- [x] 4.2 Refactor historical peak 12M sliding-window left-bound logic to non-`date-fns` month subtraction with unchanged tie/boundary semantics
- [x] 4.3 Expand/adjust stats unit tests for month-end and leap-year boundaries to guard against regression

## 5. Verification

- [x] 5.1 Run targeted tests for settings, entries validation, and stats computation to confirm behavior parity
- [x] 5.2 Run full `apps/app` test and build checks required by project workflow
- [x] 5.3 Confirm repository no longer contains runtime `date-fns` imports in app code

## 6. Belgrade-day semantics for stats

- [x] 6.1 Update income stats spec/design to define `today` as Europe/Belgrade calendar date for legal/business consistency
- [x] 6.2 Remove manual UTC date-part helper in `stats/compute.ts` using `@internationalized/date` conversion helpers directly
- [x] 6.3 Patch stats entrypoint to pass Belgrade-based `today` into `computeStats`
- [x] 6.4 Re-run focused stats tests to confirm rolling-window and boundary behavior remains stable
- [x] 6.5 Consolidate app Belgrade-day helper usage to `belgradeToday()` and remove duplicate string helper API
