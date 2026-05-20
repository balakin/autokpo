## Why

Pausal taxpayers in Serbia face two hard legal thresholds — 6,000,000 RSD per calendar year (Income Tax Act, Art. 42) and 8,000,000 RSD per any rolling 12-month window (VAT Act, Art. 33) — with no in-app visibility into how close they are. Exceeding either limit has serious consequences (loss of pausal status, mandatory VAT registration), so users need real-time awareness and historical risk review.

## What Changes

- **New stats module** with pure computation functions (no side effects, easily testable):
  - Current calendar year income (from current-year book)
  - Rolling last-12-months income (entries across all books where `datumPrometa >= today − 12 months`)
  - Historical peak calendar year (max per-book total across all years)
  - Historical peak rolling 12-month window (sliding-window scan over all entries)
  - All-time total income
- **Dashboard page** gains four stat cards (current year, last 12M, historical year peak, historical 12M peak) and a bar chart (recharts, light+dark) of income per year with a 6M threshold line; all-time total card at bottom
- **Sidebar** gains a persistent footer showing current-year and last-12M figures, colored by threshold status
- **Book list** gains an income total column per row with threshold-colored income value (no chip, color alone signals the state)
- **Individual book (entries tab)** gains a progress bar header showing the book's total vs the 6M annual limit
- **Threshold coloring** applied consistently: <90% of limit → green/success, ≥90% → yellow/warning, >100% → red/danger. Limits referenced via `ANNUAL_LIMIT` and `ROLLING_LIMIT` constants from `src/constants.ts`
- **recharts** added as a new dependency; configured for light and dark mode via CSS custom properties read by `readChartColors()`

## Capabilities

### New Capabilities

- `income-stats`: Core computation layer — calculates current year, last 12M, historical peaks, and all-time totals from the books array; pure functions, no React
- `stats-dashboard`: Dashboard stats section — cards, bar chart, threshold warnings
- `stats-sidebar`: Persistent sidebar footer with live current-year and last-12M indicators
- `stats-book-list`: Per-row income column and warning chip in the book library
- `stats-book-detail`: Progress bar in the individual book entries tab header

### Modified Capabilities

- `dashboard`: New stats section added above the existing chart placeholder (which is replaced)
- `book-library`: New income column added to each book row
- `working-layout`: New progress bar added to the entries tab header

## Impact

- **New dependencies**: `recharts` (chart library), `date-fns` (date arithmetic)
- **Files modified**: `src/dashboard/dashboard-page.tsx`, `src/app-shell/sidebar.tsx`, `src/books/book-library.tsx`, `src/working-layout/working-layout.tsx`, `src/formatters.ts`
- **New files**: `src/stats/` module (computation + React components), `src/constants.ts` (ANNUAL_LIMIT, ROLLING_LIMIT)
- **Tests required**: computation functions (unit), each new UI component (RTL)
- **i18n**: all new UI strings must be wrapped and extracted; translations needed for `en` and `ru`
- **Currency display**: monetary values use `formatCurrency` (compact, no symbol) for inline contexts and `formatFullCurrency` (with "RSD" suffix) for prominent displays — both from `src/formatters.ts`
