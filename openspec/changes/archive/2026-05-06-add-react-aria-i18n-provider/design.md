## Context

The application already has a root-level `I18nProvider` from Lingui and a custom `LocaleProvider` that reads/persists locale selection (`sr-Latn`, `en`, `ru`). Translated strings follow the selected locale, but date widgets built on React Aria (`DatePicker`, `Calendar`) can still use browser-default locale behavior because no React Aria locale context is provided.

This change is cross-cutting in two places: runtime provider composition and test provider composition. It should preserve existing locale storage/CRDT synchronization behavior while adding locale consistency for date/time UI.

## Goals / Non-Goals

**Goals:**

- Ensure React Aria date/time components resolve locale from app-selected locale, not browser defaults.
- Keep a single locale source of truth in `LocaleProvider`.
- Make runtime and tests use the same locale-provider stack.

**Non-Goals:**

- Introducing new locales.
- Changing locale persistence keys or CRDT locale sync protocol.
- Altering date validation/business rules (year bounds, unavailable-date logic, etc.).

## Decisions

### Decision: Integrate React Aria `I18nProvider` inside `LocaleProvider`

- **Choice:** Wrap `LocaleProvider` children with `I18nProvider` from `react-aria-components`, using locale derived from current app locale via `INTL_LOCALES` mapping.
- **Rationale:** `LocaleProvider` already owns active locale state and change propagation. Nesting React Aria context here avoids duplicated locale state and ensures all descendants automatically inherit date/time locale settings.
- **Alternatives considered:**
  - **Root-level wrapper in `main.tsx`:** rejected because it would require plumbing locale value outside `LocaleProvider` or duplicating locale resolution logic.
  - **Per-component wrappers around each `DatePicker`/`Calendar`:** rejected due to repetition and risk of missed coverage.

### Decision: Keep Lingui and React Aria providers separate but coordinated

- **Choice:** Retain Lingui `I18nProvider` at app root for message translation; add React Aria `I18nProvider` under `LocaleProvider` for date/time formatting context.
- **Rationale:** They solve different i18n concerns and are designed to coexist. Coordinating both through the same locale state guarantees consistency.

### Decision: Mirror provider composition in test helpers

- **Choice:** Update shared test render wrappers to include the same React Aria locale provider path used in runtime.
- **Rationale:** Prevent false positives where tests pass with browser locale defaults but production renders differently.

## Risks / Trade-offs

- **[Risk] Locale mapping mismatch (e.g., `sr-Latn` vs region-specific tags)** -> **Mitigation:** Continue using explicit `INTL_LOCALES` map and adjust only in one place if runtime inconsistencies appear.
- **[Risk] Provider nesting order regressions** -> **Mitigation:** Keep current outer order (`Lingui I18nProvider -> LocaleProvider`) and only add React Aria context inside `LocaleProvider`.
- **[Trade-off] Additional provider layer in render tree** -> **Mitigation:** Minimal overhead; gains deterministic locale behavior for date/time controls.

## Migration Plan

1. Add React Aria locale provider integration in `LocaleProvider` using current locale mapping.
2. Update shared test wrappers to match runtime provider composition.
3. Validate date widgets (segment order, weekday labels, month text) across supported locales.
4. If regressions occur, rollback by removing the new React Aria provider layer while keeping existing locale logic untouched.

## Open Questions

- Should `INTL_LOCALES['sr-Latn']` remain `sr-Latn` or be refined to `sr-Latn-RS` for stricter regional formatting expectations?
- Do we want an explicit integration test asserting date segment/weekday localization for at least one non-default locale?
