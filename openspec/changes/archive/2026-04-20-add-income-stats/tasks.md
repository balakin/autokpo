## 1. Dependencies & Formatters

- [x] 1.1 Install `date-fns` (`pnpm add date-fns`)
- [x] 1.2 Install `recharts` (`pnpm add recharts`)
- [x] 1.3 Add `formatDateLong(date: Date): string` to `src/formatters.ts` using `Intl.DateTimeFormat('sr-Latn-RS', { day: 'numeric', month: 'short', year: 'numeric' })`
- [x] 1.4 Add `formatFullCurrency(value: number): string` to `src/formatters.ts` using `Intl.NumberFormat('sr-Latn-RS', { style: 'currency', currency: 'RSD', minimumFractionDigits: 2, maximumFractionDigits: 2 })`
- [x] 1.5 Create `src/constants.ts` with `ANNUAL_LIMIT = 6_000_000` and `ROLLING_LIMIT = 8_000_000`
- [x] 1.6 Add unit tests for `formatDateLong` and `formatFullCurrency` in `src/__tests__/formatters.spec.ts` (or equivalent)

## 2. Core Computation Module

- [x] 2.1 Create `src/stats/threshold.ts` — `thresholdColor(value, limit)` returning `'success' | 'warning' | 'danger'`
- [x] 2.2 Create `src/stats/compute.ts` — `computeStats(books, today)` pure function with all five fields: `currentYearIncome`, `last12MonthsIncome`, `last12MonthsWindow`, `historicalPeakYear`, `historicalPeak12M`, `allTimeTotal`
- [x] 2.3 Implement sliding window algorithm for `historicalPeak12M` using two-pointer scan with `date-fns` `subMonths`
- [x] 2.4 Write unit tests for `computeStats` covering: empty books, single book, multi-book, cross-book 12M window, peak crossing book boundaries, boundary-inclusive dates
- [x] 2.5 Write unit tests for `thresholdColor` covering all three thresholds
- [x] 2.6 Create `src/stats/use-stats.ts` — `useStats()` hook calling `useBooks()` and `computeStats(books, new Date())`

## 3. Shared UI Components

- [x] 3.1 Create `src/stats/stat-card.tsx` — reusable card with label, value displayed via `formatFullCurrency` from `src/formatters.ts`, optional progress bar, optional subtitle (typed as `ReactNode`), color prop from `thresholdColor` result
- [x] 3.2 Create `readChartColors()` plain function inline in `src/stats/income-chart.tsx` — reads CSS custom properties from `getComputedStyle(document.documentElement)` per render
- [x] 3.3 Create `src/stats/income-chart.tsx` — recharts `BarChart` with per-year bars, `ANNUAL_LIMIT` reference line, and `readChartColors()` colors; export as default for `React.lazy`
- [x] 3.4 Write RTL test for `StatCard` covering success/warning/danger color classes and progress bar rendering
- [x] 3.5 Add i18n strings in all new components; run `pnpm i18n:extract` and fill translations for `en` and `ru`

## 4. Dashboard

- [x] 4.1 Replace hardcoded placeholder values in `src/dashboard/dashboard-page.tsx` with `useStats()` data
- [x] 4.2 Add current-year stat card (6M limit, progress bar, date range N/A)
- [x] 4.3 Add last-12M stat card (`ROLLING_LIMIT`, progress bar, legal limit reference subtitle with čl. 33 ZPDV hyperlink)
- [x] 4.4 Add historical peak year card (red if >6M, otherwise success/warning coloring)
- [x] 4.5 Add historical peak 12M card (red if >8M, window date range subtitle)
- [x] 4.6 Add all-time total card ("Ukupno", no limit, no progress bar, secondary visual weight)
- [x] 4.7 Replace chart placeholder with lazy-loaded `IncomeChart`
- [x] 4.8 Write RTL tests for dashboard stats section: renders live data, correct colors per threshold, chart renders

## 5. Sidebar

- [x] 5.1 Add stats footer section to `src/app-shell/sidebar.tsx` below nav, above version badge, with border separator
- [x] 5.2 Render current-year row ("Ova godina") and last-12M row ("12 meseci") using `useStats()`, colored by `thresholdColor`
- [x] 5.3 Write RTL test for sidebar stats footer: shows correct values, applies correct color class per threshold

## 6. Book List

- [x] 6.1 Add income total column to each book row in `src/books/book-library.tsx`, computed inline from `book.entries`
- [x] 6.2 Apply `thresholdColor` to the income value display
- [x] 6.3 Write RTL test for book list income column: correct value, correct color for each threshold state

## 7. Book Detail

- [x] 7.1 Add `BookIncomeProgress` component above entries table in `src/working-layout/working-layout.tsx` (Unosi tab only), showing income vs `ANNUAL_LIMIT` progress bar with legal reference hyperlink (čl. 42 ZPDGa)
- [x] 7.2 Compute book total income from `useEntries()` or book entries prop; apply `thresholdColor`
- [x] 7.3 Write RTL test for entries tab progress bar: updates on entry add, correct color per threshold
