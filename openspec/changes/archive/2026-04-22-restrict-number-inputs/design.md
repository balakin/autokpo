## Context

Three entity profile fields — PIB (9 digits), šifra poreskog obveznika (8 digits), and šifra delatnosti (4 digits) — are plain HeroUI `<Input>` elements with no client-side input restrictions. Users can type letters and symbols; validation only fires on form submit via Zod. On mobile, the full alphabetic keyboard appears instead of a numeric one.

## Goals / Non-Goals

**Goals:**

- Restrict digit-only fields to only accept numeric characters at the input level
- Show numeric keyboard on mobile devices for these fields
- Enforce `maxLength` matching each field's expected digit count
- Strip non-digit characters on input (handles paste)

**Non-Goals:**

- Creating a reusable UI component (keep it simple: extracted helper + inline props)
- Replacing `NumberField` for currency inputs (already handled by `react-currency-input-field`)
- Changing Zod validation rules (they already validate correctly at submit time)

## Decisions

### 1. Extracted `digitsOnly` helper + inline props on existing `<Input>` elements

No new component. Extract a pure `digitsOnly(value: string): string` function into `src/formatters.ts` alongside existing formatters. Add `inputMode="numeric"` and `maxLength` directly to the three digit `<Input>` elements. Use `digitsOnly` in the `Controller`'s `onChange`.

**Alternatives considered:**

- `DigitsField` component — rejected: over-engineered for three fields with the same simple pattern; inline approach is clearer and avoids TypeScript issues with `TextField` children composition
- `type="number"` — rejected: browser adds stepper UI, no `maxLength` support, value becomes floating-point
- HeroUI `NumberField` — rejected: stepper UI inappropriate; values are codes, not quantities

### 2. `inputMode="numeric"` without `pattern="[0-9]*"`

We use `inputMode="numeric"` alone to trigger the numeric keyboard on mobile. We omit `pattern="[0-9]*"` because we don't want browser-native validation — our Zod schema handles validation, and the `digitsOnly` helper strips non-digits at input time, making browser pattern validation redundant.

## Risks / Trade-offs

- **[Paste handling]** → The `digitsOnly` helper strips non-digits on paste, which is correct for code fields.
- **[No component reuse]** → `digitsOnly` lives in `formatters.ts` alongside other formatting helpers. If more digit-only fields appear later, it's ready to use.
- **[React Compiler]** → The `digitsOnly` helper is a pure function — no memoization concern.
