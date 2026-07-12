## 1. Suggestion corpus selector

- [x] 1.1 Add a doc-wide `descriptionSuggestions()` selector to `apps/app/src/entries/entry-selectors.ts` that walks every book in `doc.getMap('books')`, collects all entry descriptions, and returns a ranked, deduplicated `string[]`. Takes no `bookId` — it reads the whole document (see `bookSelectors.statsBooks` for the doc-wide walk precedent).
- [x] 1.2 Dedupe on a trimmed, case-folded key; count frequency per key; track the latest `datumPrometa` and the most recently entered original spelling per key.
- [x] 1.3 Sort by frequency descending, tiebreak by latest `datumPrometa` descending. Emit the original spelling as the corpus value.
- [x] 1.4 Unit-test the selector in `apps/app/src/entries/__tests__/entry-selectors.spec.ts` against real Yjs-seeded state (no mocks): descriptions collected across multiple books; frequency ordering; recency tiebreak; case/whitespace variants collapsing to one entry with the summed count and the most recent spelling; empty document returns `[]`.

## 2. Query-time filter

- [x] 2.1 Add a pure filter module under `apps/app/src/entries/` exporting a function taking `(corpus, query, limit)` and returning at most `limit` suggestions.
- [x] 2.2 Implement case-insensitive **substring** matching (not prefix — must be no narrower than the browser's own datalist filter). Return `[]` for an empty or whitespace-only query. Preserve corpus order (already ranked), filtering before slicing.
- [x] 2.3 Unit-test the filter: empty query returns `[]`; match at start; match mid-string; case-insensitivity; no-match returns `[]`; cap enforced at 5; ranked order preserved through the filter; every returned item genuinely matches the query.

## 3. Form wiring

- [x] 3.1 In `apps/app/src/entries/entry-form.tsx`, read the corpus with `useYDoc(entrySelectors.descriptionSuggestions())` and watch the current field value with `useWatch({ control, name: 'opisPrometa' })`.
- [x] 3.2 Generate a stable datalist id with `useId()`. Pass `list={datalistId}` to the `Input` inside the `opisPrometa` `Controller`, and render a sibling `<datalist id={datalistId}>` whose `<option>` elements are the filtered suggestions.
- [x] 3.3 Confirm zero `<option>` elements are rendered when the field is empty — this is what enforces the "at least one character" rule; no separate gate.
- [x] 3.4 Leave the `TextField`/`Label`/`FieldError` structure, `field.onChange`/`onBlur`/`ref` wiring, Zod resolver, and styling untouched. Do not introduce a custom dropdown component.

## 4. Tests and checks

- [x] 4.1 Extend `apps/app/src/entries/__tests__/entry-form.spec.tsx`: the description input carries a `list` attribute pointing at a rendered `<datalist>`; the datalist has no options when the field is empty; typing a matching prefix/substring populates it with the expected options (max 5); required-field validation still reports "Polje je obavezno".
- [x] 4.2 Run the entries tests: `cd apps/app && pnpm -s test src/entries --reporter=verbose`.
- [x] 4.3 Typecheck/build: `cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:' | head -n 40`.
- [x] 4.4 Lint and format: `cd apps/app && pnpm -s eslint . --fix` and `pnpm -s prettier --write --log-level=error apps/app` from the repo root.

## 5. Manual browser verification

Not coverable in jsdom — jsdom does not implement datalist dropdown behavior. Must be done in a real browser before merge.

- [x] 5.1 Confirm the suggestion dropdown renders inside the entry `Modal` (portalled) in Chrome and Firefox.
- [x] 5.2 Confirm **selecting a suggestion propagates through the controlled React Aria `TextField`** into React Hook Form state and saves correctly — the riskiest assumption in this change (see design.md).
- [x] 5.3 Confirm suggestions from a previous year's book appear while editing the current year's book.
- [x] 5.4 Confirm nothing appears on focus/click while the field is empty.
