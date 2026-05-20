## Context

`apps/app` currently uses both `date-fns` and `@internationalized/date`. The former is used in entry validation, stats window arithmetic, and settings sync timestamp labels; the latter is already required by HeroUI date components and is used for `DateValue`/`CalendarDate` flows. This split creates redundant concepts and increases dependency maintenance overhead.

The target change is dependency consolidation: remove `date-fns` while preserving functional behavior in date validation, rolling-window stats, and localized sync labels.

## Goals / Non-Goals

**Goals:**

- Remove `date-fns` from `apps/app` runtime and tests.
- Preserve existing behavior and edge-case semantics for:
  - entry date validation against today and selected book year,
  - rolling 12-month stats window boundaries,
  - settings sync relative/absolute timestamp display.
- Use `Europe/Belgrade` as the legal-business definition of "today" for stats and entry-date constraints.
- Standardize date comparisons for ISO entry dates (`YYYY-MM-DD`) on `@internationalized/date` calendar values.

**Non-Goals:**

- Redesigning user-facing date copy or introducing new timestamp UX.
- Reworking stats algorithms beyond date primitive replacement.
- Changing persisted data formats.

## Decisions

### 1) Use `@internationalized/date` as the only date utility dependency

All date arithmetic/comparison currently handled by `date-fns` SHALL be rewritten using `@internationalized/date` primitives (`CalendarDate`, parsing helpers, comparison helpers) and narrow conversion helpers where native `Date` is required.

**Rationale:** consolidates around the dependency already required by HeroUI and removes duplicate date abstractions.

**Alternative considered:** keep `date-fns` for arithmetic and only remove formatting usage. Rejected because it retains dual date stacks and does not achieve dependency simplification.

### 2) Use `Intl.DateTimeFormat` and `Intl.RelativeTimeFormat` for settings sync labels

Settings sync labels SHALL use platform `Intl` APIs for localized absolute and relative representations. Relative formatting cadence and anti-future phrasing behavior remain unchanged.

**Rationale:** `Intl` is built-in, locale-aware, and sufficient for current formatting needs without third-party locale packs.

**Alternative considered:** create custom phrase tables per locale. Rejected due to translation maintenance burden and weaker locale correctness.

### 3) Keep stats window semantics while defining `today` as Europe/Belgrade

Rolling 12-month calculations SHALL continue to use inclusive boundaries and calendar-month subtraction semantics equivalent to current behavior. For legal consistency with tax workflows, `today` used by stats SHALL be derived from the `Europe/Belgrade` calendar date. Implementation may use `CalendarDate` month subtraction and ISO string comparisons to preserve deterministic day-level behavior.

**Rationale:** avoids regressions in business-critical threshold calculations.

**Alternative considered:** approximate with fixed day counts (e.g., 365 days). Rejected because it changes leap-year and month-end behavior.

### 4) Keep schema-level validation rules unchanged while replacing parser/comparator internals

Entry date schema rules (required, ISO format, not future, within book year) SHALL remain unchanged for users. Only internal validation primitives are replaced.

**Rationale:** minimizes behavioral risk and keeps compatibility with existing tests and expectations.

### 5) Use a single Belgrade "today" helper surface in app source

App source SHALL rely on `belgradeToday()` from `src/belgrade-date.ts` as the canonical helper for Belgrade current date semantics. String use cases SHALL derive ISO dates via `.toString()` on `CalendarDate` rather than keeping a parallel `belgradeDateToday()` string helper.

**Rationale:** removes redundant date helper APIs and keeps date handling consistent around `CalendarDate`.

## Risks / Trade-offs

- [Locale output drift in relative labels] → Mitigation: assert locale-specific expectations in settings tests using shared formatter helpers rather than hardcoded phrasing where possible.
- [Boundary regressions around month-end/leap-year subtraction] → Mitigation: add/retain focused unit tests for exact boundary inclusion in `computeStats` and historical 12M scan windows.
- [Mixing `CalendarDate` and `Date` accidentally] → Mitigation: centralize conversion helpers and keep comparisons in one domain per code path.
- [Spec wording becoming implementation-heavy] → Mitigation: keep requirements behavior-focused; implementation details stay in this design.
