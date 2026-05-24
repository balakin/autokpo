## 1. Core Implementation

- [x] 1.1 Add scale-aware tick formatter logic in `src/stats/income-chart.tsx` — compute `maxIncome` from data, derive a formatter closure (raw/K/M tiers per design.md), apply it to `YAxis.tickFormatter`

## 2. Tests

- [x] 2.1 Add test cases for small income (< 10K) producing raw integer ticks
- [x] 2.2 Add test case for moderate income (< 1M) producing K-suffix ticks
- [x] 2.3 Add test case for large income (≥ 1M) producing M-suffix ticks (already partially covered)
- [x] 2.4 Add test case for zero/empty data producing valid "0" ticks

## 3. Verification

- [x] 3.1 Run lint: `pnpm -s eslint apps/app --fix --format=json` and fix any issues
- [x] 3.2 Run typecheck: `cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:' | head -n 40`
- [x] 3.3 Run tests: `cd apps/app && pnpm -s test --reporter=verbose | tail -n 120`
