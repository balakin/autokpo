## Context

The income bar chart (`src/stats/income-chart.tsx`) uses a hardcoded Y-axis tick formatter:

```ts
tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`}
```

This always divides by 1,000,000 and rounds to a whole number with an "M" suffix. When income values are small (e.g., 50K RSD), recharts auto-scales the domain to ~0-60K and creates ticks like `[0, 10000, 20000, …]`. The formatter produces `"0M"` for every tick because `0.01`-`0.06` all round to `0`.

The chart is part of the dashboard, lazy-loaded with `React.lazy`. The only external dependency is recharts.

## Goals / Non-Goals

**Goals:**

- Y-axis ticks show meaningful, distinguishable values at any income scale
- Ticks use the same abbreviation (K or M) across the entire axis for visual consistency
- Zero change in appearance for large incomes (6M+)
- No new dependencies

**Non-Goals:**

- Dynamically adjusting the reference line visibility (reference line at 6M stays)
- Changing tooltip formatting (stays `formatFullCurrency`)
- Changing bar rendering or domain calculation

## Decisions

### Decision 1: Scale-uniform formatter driven by data maximum

**Chosen**: Compute a single formatter closure from the maximum value across all bars. Pick abbreviation tier based on that max.

```
max < 10_000      → raw number (e.g., "5000")
max < 1_000_000   → "K" suffix, 0 decimals (e.g., "50K")
max ≥ 1_000_000   → "M" suffix, 1 decimal (e.g., "5.5M")
```

**Alternatives considered**:

- Per-tick formatter (each tick picks its own best abbreviation) — rejected: mixed K/M labels on same axis look inconsistent
- `Intl.NumberFormat` compact notation (`notation: "compact"`) — rejected for this option: Serbian Latin locale support for compact numbers varies by browser, and the K/M abbreviations are more predictable. May revisit as a follow-up if locale support improves.
- Adding yet another formatter to `formatters.ts` (e.g., `formatAxisCurrency`) — rejected: the formatter is a simple closure coupled to the chart data, not a general-purpose utility.

### Decision 2: Formatter computed in the component body

**Chosen**: Compute the formatter inside `IncomeChart`, before the JSX, based on `data` (which is already computed from `books`). This keeps the logic colocated with the chart.

### Decision 3: No change to `formatters.ts`

The existing `formatCurrency` and `formatFullCurrency` serve different purposes (compact display and full currency). The axis formatter is chart-specific and doesn't need to be exported.

## Risks / Trade-offs

- **Threshold boundary flicker**: When data crosses a tier boundary (e.g., 999,999 → 1,000,000), the abbreviation changes from K to M. This is a rare edge case and the visual change is minimal.
- **Raw numbers for very small data**: Values under 10K show as raw integers without grouping (e.g., "5000" not "5.000"). This is intentional — axis ticks should be terse. Grouping dots would crowd the axis.
- **0 tick**: Always shows "0" regardless of tier, preserving the current behavior.
