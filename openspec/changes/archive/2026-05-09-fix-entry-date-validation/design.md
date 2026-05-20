## Context

`EntryForm` renders a HeroUI `DatePicker` with an embedded `Calendar`. Currently, the valid date range is enforced entirely through `isDateUnavailable`, which only grays out individual dates — it does not constrain navigation or determine where the calendar opens. As a result, when editing a past-year book (e.g., 2024) in the current year (e.g., 2026), the calendar opens on today's month with all dates grayed out and no visual cue that the user needs to navigate back two years.

Additionally, `datumPrometaSchema` uses `parseIsoCalendarDateSafe`, which swallows parse exceptions by returning `null`. `withParsedDate` then returns `false` on null, which inverts the check — making impossible dates like `2025-02-30` pass all three refines.

## Goals / Non-Goals

**Goals:**

- Calendar opens at the correct year for past-year books
- Navigation is constrained to the valid date range
- Impossible calendar dates (e.g., Feb 30) are rejected by the schema
- Year-boundary errors take priority over the generic future-date error

**Non-Goals:**

- Changing the overall date picker component or library
- Modifying how dates are stored or displayed in the table

## Decisions

### 1. Replace `isDateUnavailable` with `minValue` / `maxValue` on `Calendar`

`minValue={startOfYear}`, `maxValue={min(today, endOfYear)}`.

React Aria Calendar clamps the focused date to within `[minValue, maxValue]` when it falls outside the range, so the calendar automatically opens at the correct month for past-year books. Navigation buttons and the year picker are also constrained to the valid range.

`isDateUnavailable` is removed entirely — the valid range is contiguous, so per-date filtering is unnecessary.

**Alternative considered**: keep `isDateUnavailable` and add a `focusedValue` state to force the initial view. Rejected: two mechanisms for one constraint, and `focusedValue` requires controlled state that adds complexity.

### 2. Stabilize `today` with `useState`

`const [today] = useState(() => belgradeToday())` captures the date once on mount.

Without this, `belgradeToday()` returns a new `CalendarDate` object every render. Even with the React Compiler enabled, the compiler cannot know that two `CalendarDate` instances with the same value are semantically equal, so `minValue`/`maxValue` (and previously `isDateUnavailable`) would receive new references every render. `useState` makes `today` referentially stable.

`startOfYear` and `endOfYear` depend only on the `year` prop (which doesn't change during a form session), so the React Compiler can memoize them — no manual stabilization needed.

**Alternative considered**: `useMemo`. Rejected: project rules prohibit hand-written `useMemo` (React Compiler handles memoization).

### 3. Add explicit calendar-validity refine after the regex

A new `.refine()` that calls `parseDate` and returns `false` if it throws, placed between the regex check and the boundary checks:

```
.min(1)            → "required"
.regex(...)        → "invalid format" (YYYY-MM-DD pattern)
+ parseDate refine → "invalid format" (catches Feb 30, month 13, etc.)
.refine(isBeforeBookYear)
.refine(isAfterBookYear)
.refine(isFutureDate)
```

The same error message ("Neispravan format datuma") is reused — an impossible date is still a format error from the user's perspective.

**Alternative considered**: flip `withParsedDate` to return `true` on null (making parse failure mean "constraint violated"). Rejected: too subtle, breaks the semantics of the helper for its three callers.

### 4. Reorder boundary refines: `isBeforeBookYear` → `isAfterBookYear` → `isFutureDate`

Year-boundary errors are more actionable for a year-scoped form. The future-date error is a special case of the after-year error for the current year — when both fire, the year error should win.

Zod runs all `.refine()` calls independently (no short-circuit), but `issues[0]` — the error shown in the UI — reflects the refine order.

## Risks / Trade-offs

- **React Aria clamping behavior**: the decision to drop `isDateUnavailable` relies on React Aria clamping the focused date to `[minValue, maxValue]`. This behavior should be verified manually in the browser after implementation. If it doesn't clamp, the fallback is a `defaultFocusedValue` prop (or controlled `focusedValue` via a one-time `useState`).
- **`today` frozen at mount**: if a user opens a form near midnight and keeps it open, the valid range won't update. This is the correct behavior — the form session's date should be stable.
