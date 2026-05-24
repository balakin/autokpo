## Why

The income bar chart Y-axis always formats tick values as whole millions (`toFixed(0) + "M"`). This collapses small incomes (e.g., 50K RSD) into useless "0M" labels on every tick, because `0.05M` rounds to `0M`. The bars render at correct heights — the problem is purely the tick label formatting.

## What Changes

- Replace the hardcoded `(v / 1_000_000).toFixed(0) + "M"` tick formatter with a scale-aware formatter that picks the appropriate abbreviation (raw numbers, K, or M) based on the maximum value in the data
- The chart continues to render identically for large incomes (6M+); only small-data formatting improves

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `stats-dashboard`: Add requirement for adaptive Y-axis tick formatting on the income bar chart

## Impact

- `src/stats/income-chart.tsx` — replace tick formatter with data-aware version
- `src/__tests__/income-chart.spec.tsx` — add test cases for small/large data formatting
