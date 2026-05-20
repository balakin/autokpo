## Context

The dashboard currently shows hardcoded placeholder values with no live data. The book list shows no income information. The sidebar has no stats. Users have no visibility into their proximity to the 6,000,000 RSD annual pausal tax threshold (Art. 42, Income Tax Act) or the 8,000,000 RSD rolling 12-month VAT threshold (Art. 33, VAT Act).

All book data lives in a flat array in localStorage, accessed globally via `useBooks()`. Each book has a `year: number` and `entries[]` with `datumPrometa: string (YYYY-MM-DD)`, `odProdajeProizvoda: number`, and `odIzvrsenihUsluga: number`. Entry income = sum of both fields.

React Compiler is enabled — no manual `useMemo`/`useCallback`.

## Goals / Non-Goals

**Goals:**

- Compute five stats from raw books data: current-year income, last-12M income, historical peak year, historical peak 12M window, all-time total
- Display stats with threshold-aware coloring across dashboard, sidebar, book list, and book detail
- Add a per-year bar chart with recharts, themed for light and dark mode
- All computation in pure functions, independently testable

**Non-Goals:**

- Server-side computation or persistence of stats
- Notifications or push alerts
- Stats for individual entries (only book/period aggregates)
- Projections or forecasting

## Decisions

### 1. Pure computation module at `src/stats/compute.ts`

All five stats are computed by a single `computeStats(books: Book[], today: Date): Stats` pure function. No React, no side effects. This makes unit testing trivial and keeps components thin.

The function is called inside a `useStats()` hook that passes `useBooks()` and `new Date()` as arguments. React Compiler handles memoization automatically.

**Alternative considered**: computing stats inline in each component. Rejected — duplicates logic across four surfaces and makes testing harder.

### 2. Sliding window for historical 12M peak

Sort all entries across all books by `datumPrometa` ascending. Use a two-pointer scan:

- `right` advances one entry at a time
- `left` advances to exclude entries where `datumPrometa < right.datumPrometa − 12 calendar months`
- Maintain a running sum; track the maximum sum and the `right` entry date as the window end

Window start = window end date − 12 months (same calendar day). Complexity: O(n log n) sort + O(n) scan.

**"12 calendar months back"** means: if right-edge is 2025-04-20, window start is 2024-04-20. Uses date-fns `subMonths` (already used in the project) to avoid leap-year and edge-case bugs.

**Alternative considered**: checking every possible pair. Rejected — O(n²), unnecessary.

### 3. Current 12M window definition

`[subMonths(today, 12), today]` inclusive on both ends, matching the law's "prethodnih 12 meseci" — a rolling day-precise window, not calendar-month-aligned.

### 4. Threshold coloring: three-state

| Range            | Color token        | Semantic    |
| ---------------- | ------------------ | ----------- |
| < 90% of limit   | `success` (green)  | Safe        |
| ≥ 90% and ≤ 100% | `warning` (yellow) | Approaching |
| > 100%           | `danger` (red)     | Exceeded    |

A single `thresholdColor(value, limit)` utility returns one of `"success" | "warning" | "danger"`. Used for progress bars, chips, and card accent colors.

### 5. recharts light/dark theming

recharts uses SVG props (fill, stroke) and inline styles — it does not read CSS custom properties automatically. The `readChartColors()` plain function in `income-chart.tsx` reads relevant design-token CSS variables from `getComputedStyle(document.documentElement)` and returns a typed object with color values. The chart component calls this function on each render, which picks up theme changes when the component re-renders. No explicit `MutationObserver` or theme-context dependency is used — the function reads CSS variables synchronously per render and relies on React's normal re-rendering cycle.

**Alternative considered**: hardcoding two color palettes and switching on theme. Rejected — diverges from the single source of truth in CSS tokens. A `useChartTheme()` React hook wrapping `readChartColors()` with a `MutationObserver` for theme-change reactivity was considered but deemed unnecessary since the component re-renders on navigation and state changes.

### 6. Stats module location: `src/stats/`

```
src/stats/
  compute.ts          — pure computeStats() + helpers
  use-stats.ts        — useStats() hook (calls useBooks + compute)
  threshold.ts        — thresholdColor() utility
  income-chart.tsx    — recharts bar chart component + inline readChartColors()
  stat-card.tsx       — reusable stat card with progress bar + AllTimeTotalCard
```

`SidebarStatsFooter` is defined inline in `src/app-shell/sidebar.tsx` rather than as a separate module, since it is tightly coupled to sidebar layout and styling. The `readChartColors()` function is inline in `income-chart.tsx` since it reads chart-specific CSS variables and is called directly by the chart component on each render.

### 7. date-fns for date math

date-fns is not currently installed and must be added (`pnpm add date-fns`). It is the idiomatic choice for arithmetic like `subMonths`, `isAfter`, `isBefore`. Preferred over `@internationalized/date` (used only for the HeroUI date picker) for general date math.

The `format` function from date-fns IS used in `compute.ts` for internal date-to-string conversion (comparing `datumPrometa` strings). This is computation-only, not display — all user-facing date formatting goes through `formatDateLong` from `src/formatters.ts` (see Decision 9).

### 8. Date range display for historical 12M window

The historical peak 12M stat SHALL display its exact window as a subtitle, formatted with day-level precision: **"12 apr 2023 – 12 apr 2024"**. The window end is the right-edge entry date, start is `subMonths(windowEnd, 12)`. Display formatting uses `formatDateLong(date: Date): string` added to `src/formatters.ts`, using `Intl.DateTimeFormat('sr-Latn-RS', { day: 'numeric', month: 'short', year: 'numeric' })` — consistent with the existing `formatDate` pattern, no date-fns `format` needed for display.

The current 12M card subtitle does NOT show a date range — it shows the legal limit reference with a hyperlink (see Decision 11).

### 9. Currency display uses both `formatCurrency` and `formatFullCurrency`

Two formatters exist in `src/formatters.ts`:

- **`formatCurrency(value: number): string`** — produces numbers without currency symbol (e.g., `"4.200.000,00"`). Used for inline income values in compact contexts: book-library income column, working-layout income value in the progress bar header.
- **`formatFullCurrency(value: number): string`** — produces full currency-with-symbol output (e.g., `"4.200.000,00 RSD"`). Used in stat-cards (main value display), sidebar stats, dashboard card subtitles (limit amounts), income-chart tooltip, and working-layout limit label.

`formatFullCurrency` uses `Intl.NumberFormat('sr-Latn-RS', { style: 'currency', currency: 'RSD', minimumFractionDigits: 2, maximumFractionDigits: 2 })`. `formatCurrency` uses the existing `react-currency-input-field` `formatValue` to maintain backward compatibility with entry editing.

### 10. Legal reference limits in `src/constants.ts`

The two legal threshold amounts are extracted into named constants in `src/constants.ts`:

- `ANNUAL_LIMIT = 6_000_000` — calendar-year pausal tax threshold (čl. 42 ZPDGa)
- `ROLLING_LIMIT = 8_000_000` — rolling 12-month VAT threshold (čl. 33 ZPDV)

All components and computation code reference these constants instead of hardcoding the numeric values.

### 11. Legal reference hyperlinks in stat card subtitles

Stat card subtitles for the current-year and last-12M cards include hyperlinks to the relevant Serbian tax law articles, rendered as `<a>` tags with `target="_blank" rel="noopener noreferrer"`:

- Current-year card: `"Limit: {formatFullCurrency(ANNUAL_LIMIT)} (čl. 42 ZPDGa)"` linking to `https://mfin.gov.rs/sr/propisi-1/zakon-o-porezu-na-dohodak-gradjana-1`
- Last-12M card: `"Limit: {formatFullCurrency(ROLLING_LIMIT)} (čl. 33 ZPDV)"` linking to `https://purs.gov.rs/pravna-lica/pdv/zakon/202/zakon-o-porezu-na-dodatu-vrednost.html`
- Working-layout progress bar: `"Limit: {formatFullCurrency(ANNUAL_LIMIT)} (čl. 42 ZPDGa)"` with the same mfin.gov.rs link

These.subtitle values are typed as `ReactNode` (not `string`) in `StatCardProps` to support JSX content including `<Trans>` with embedded `<a>` tags.

### 12. `StatCard` subtitle typed as `ReactNode`

The `StatCard` component's `subtitle` prop is typed as `ReactNode` (not `string`) to support rich content — `Trans` components with embedded links, formatted values, and plain strings. Historical peak cards pass plain string subtitles (year number, formatted date range), while limit cards pass JSX `<Trans>` subtrees with embedded `<a>` hyperlinks.

## Risks / Trade-offs

- **recharts bundle size** (~150 KB gzipped): acceptable for a desktop-oriented tool; mitigated by lazy-loading the chart component with `React.lazy` inside the dashboard
- **Date arithmetic edge cases** (e.g., Feb 29 in leap years): mitigated by using date-fns `subMonths` which handles these correctly
- **No current-year book**: if no book exists for `currentYear`, current-year income = 0; the stat card still renders with a green bar at 0%
- **Clock skew / timezone**: all dates are stored as `YYYY-MM-DD` strings with no timezone; `new Date()` is passed in as a parameter to `computeStats`, enabling deterministic testing
