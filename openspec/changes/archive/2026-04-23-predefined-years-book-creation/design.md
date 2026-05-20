## Context

The add-book modal currently generates a year range from `(currentYear − 10)` to `(currentYear + 1)` using two constants (`YEAR_RANGE_PAST = 10`, `YEAR_RANGE_FUTURE = 1`) that live inside `add-book-modal.tsx`. The Pravilnik (official regulation prescribing the KPO form) has been in force since 2005 — years before 2005 are legally irrelevant and years after the current one cannot have tax records. The default value is always empty, so users must manually select the most common choice (current year) every time.

## Goals / Non-Goals

**Goals:**

- Bound the year selector's lower end to the Pravilnik's effective year (2005) instead of an arbitrary offset
- Remove future years from the selector (upper bound = current year)
- Default the selector to the current year when it is available, or to an empty selection when it is occupied
- Centralize the constant so other specs/code can reference it

**Non-Goals:**

- Changing year uniqueness enforcement (already works correctly)
- Changing the PDF header "Datum objavljivanja" field (separate concern)
- Allowing free-text year input (the `Select` dropdown remains)

## Decisions

### 1. New `KPO_FIRST_YEAR` constant in `src/constants.ts`

**Choice**: Add `KPO_FIRST_YEAR = 2005` to the existing constants file alongside `ANNUAL_LIMIT` and `ROLLING_LIMIT`.

**Rationale**: Keeps the magic number in one discoverable place. The Pravilnik came into force in 2005 — any year before that is outside the legal scope of KPO and should not be offered.

**Alternative considered**: Derive from the Official Gazette metadata (140/2004 → effective 2005). Rejected — hardcoding is simpler and the value never changes; tracking publication metadata would add complexity for no functional benefit.

### 2. Year range = `[KPO_FIRST_YEAR … currentYear]`, descending

**Choice**: Replace `YEAR_RANGE_PAST` / `YEAR_RANGE_FUTURE` with a computed range from `KPO_FIRST_YEAR` to `currentYear`, ordered newest-first.

**Rationale**: Future years have no tax records. The lower bound now has a permanent legal anchor rather than drifting with the current year.

### 3. Default = `currentYear` when available, `""` when occupied

**Choice**: When no book exists for `currentYear`, pre-select it in the form's `defaultValues`. When `currentYear` is already occupied, keep the existing empty-string default.

**Rationale**: Current year is the overwhelmingly common choice; pre-selecting it removes one interaction step. Falling back to empty when occupied preserves the uniqueness constraint without requiring the system to pick a "next best" year.

**Alternative considered**: Always default to current year and disable it visually. Rejected — a pre-selected disabled value is confusing UX; the empty state clearly communicates "pick a year."

## Risks / Trade-offs

- **[Year list grows over time]** → In 2026 the list has 22 entries (2005–2026). In 2030 it will have 26. This is well within HeroUI `Select` usability. If it ever becomes unwieldy, a search-as-you-type approach could replace the flat list, but premature optimization.
- **[Hardcoded 2005]** → If the Pravilnik is superseded, the constant needs updating. Risk is negligible — fiscal regulations change very rarely, and this is a single-line change.
