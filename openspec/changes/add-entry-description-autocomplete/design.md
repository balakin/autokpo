## Context

The Opis prometa field lives in `apps/app/src/entries/entry-form.tsx`, rendered as a React Hook Form `Controller` wrapping a HeroUI v3 `TextField` + `Input`. HeroUI's `Input` spreads `...rest` into React Aria's `Input`, which spreads onto the real DOM `<input>` — so a `list` attribute reaches the element without any wrapper or fork.

The data lives further away than it first appears. Entries are stored **inside books** (`books: Map<bookId, { year, entries: Y.Array<KpoEntry> }>`), and a book **is** a year. `entrySelectors.all(bookId)` reads exactly one book. "Descriptions from previous years" is therefore not a filter within the current entry list — it is a **cross-book read of the whole document**. `bookSelectors.statsBooks` (`book-selectors.ts:108`) is the existing precedent for a doc-wide entry walk.

Books may share a year (`duplicateYearSummary` exists precisely because of this) and years are not guaranteed contiguous, which is why this design reads **all books unconditionally** rather than inventing a year-cutoff rule.

## Goals / Non-Goals

**Goals:**

- Offer prior entry descriptions as native browser suggestions on Opis prometa.
- Source them from every book in the document, ranked by frequency, deduped, capped at 5.
- Leave the existing form behavior, validation, styling, and accessibility untouched.

**Non-Goals:**

- No custom dropdown, popover, listbox, or autocomplete component. Not HeroUI `Autocomplete`/`ComboBox` either — the native `<datalist>` is the deliberate choice.
- No diacritic-insensitive matching (see Risks — this is impossible with `<datalist>` and is accepted).
- No new persisted state. This is a read-only projection over existing entries.
- No fuzzy matching, no scoring beyond frequency + recency, no server involvement.

## Decisions

### The browser owns the final filter — ours must be a superset

This is the governing constraint of the whole design, and every other decision follows from it.

```
  user types "kanc"
        │
        ▼
  ┌────────────────────────────┐
  │  OUR filter                │  substring match, dedupe, rank, slice to 5
  └────────────┬───────────────┘
               ▼
  ┌────────────────────────────┐
  │  BROWSER's datalist filter │  ← cannot be disabled
  │  case-insensitive substring│
  └────────────┬───────────────┘
               ▼
     what the user actually sees
```

The browser re-filters the `<option>` elements we supply against the input value before presenting them. Two consequences we must design around:

1. **Our match must be no narrower than the browser's.** If we prefix-matched while the browser substring-matches, we would discard options the browser would gladly have shown. We therefore use a **case-insensitive substring** match — the same semantics the browser uses — so the 5 options we hand over all survive the second pass.
2. **We must filter _before_ slicing.** Slicing an unfiltered corpus (e.g. "just hand over the 5 most frequent descriptions") would let the browser filter all 5 away and show nothing, even when a perfect match sat at position 6. Filter, then cap.

_Alternative considered:_ prefix matching, which is a more conventional autocomplete affordance. Rejected — it is strictly narrower than the browser's own filter and would silently drop valid matches.

### Rank once in the selector; filter per keystroke in the component

Frequency ranking is **query-independent**, so the corpus can be ranked once and a substring filter over it **preserves that order**. There is no per-keystroke sort.

```
entry-selectors.ts    descriptionSuggestions()   doc → ranked, deduped string[]
                                                  (runs on doc change only)
                                │
                                ▼
<new pure module>     filterSuggestions(          corpus + query → ≤5
                        corpus, query, limit)      (runs per keystroke)
                                │
                                ▼
entry-form.tsx        useYDoc(corpus)             <Input list={id} />
                      useWatch('opisPrometa')     <datalist id={id}>
```

The query deliberately stays **out** of the selector. `useYDoc` re-runs its selector on every doc transaction and compares results with `shallowEqual`, which does element-wise `Object.is` on arrays (`utils/shallow-equal.ts:11-17`). A `string[]` corpus is therefore referentially stable across unrelated edits and across keystrokes. Baking the query into the selector would re-walk every book on every keypress for no benefit.

_Alternative considered:_ a `descriptionSuggestions(query)` selector factory. Rejected for the reason above.

### Rank by frequency, tiebreak on recency

KPO entries are repetitive: the same few clients and services recur monthly. Frequency surfaces the habitual entries; pure recency would be dominated by whatever was typed last week.

The **tiebreak carries more weight than it appears to**. A new user with eight distinct descriptions has every count equal to 1, so recency decides the entire list; even a mature book has a long tail of one-offs. Recency (latest `datumPrometa` among entries sharing the description) degrades gracefully to pure recency in exactly the cold-start case where frequency says nothing.

### Dedupe on a normalized key, display the original spelling

Counting key: **trimmed and case-folded**. Display value: the **most recently entered original spelling**.

Without this, `Konsultacije`, `konsultacije`, and `Konsultacije ` would burn three of five slots on one idea and violate the uniqueness requirement in spirit. Note the normalization applies to **grouping only** — the string placed in `<option value>` is always a real description the user actually typed, so it still survives the browser's filter.

### The "at least one character" rule needs no gate

If the corpus filter returns nothing for an empty query, we render **zero `<option>` elements**, and the browser has nothing to present on focus or click. The requirement is satisfied as a consequence of the filter's own contract rather than by a separate condition.

### The 5-item cap is ours to enforce

The HTML spec imposes no limit on `<datalist>` options; Chrome and Firefox render every match in a scrollable list. Capping at 5 also lands under Chrome's ~6-row visible window, so the dropdown never scrolls and every suggestion is visible at a glance.

### The edited entry counts toward its own frequency

When editing, the entry's own description is in the corpus and inflates its count by one. Excluding it is a one-line filter, but the effect is invisible to anyone not looking for it, and the extra branch is not worth carrying.

## Risks / Trade-offs

- **Diacritic-blindness — permanent and user-visible.** A user typing `sifra` will never be offered `Šifra za oktobar`. Serbian Latin uses `č ć š ž đ`, so this will be hit in practice. There is **no mitigation** within the `<datalist>` constraint: even if our filter folded diacritics, the browser's own filter does not, and it would drop the option before render. `<option label>` does not help, because selection populates `value`. → **Accepted.** Escaping it would require HeroUI `Autocomplete`/`ComboBox`, which the no-custom-component constraint rules out. Recorded here so this is a known trade-off rather than a bug filed in six months.

- **Datalist selection must propagate through a controlled React Aria input.** Picking an option fires an `input` event; React's synthetic `onChange` should fire and reach `field.onChange`. This _should_ work, but it crosses a controlled RAC `TextField` inside a portalled `Modal`. → **Mitigation:** verify manually in a real browser before merge. This is the single riskiest assumption in the change.

- **Safari's `<datalist>` support is the weakest of the three engines** and its dropdown behavior is the least predictable. → **Mitigation:** the feature is purely additive — if Safari presents nothing, the field still behaves exactly as it does today. Degradation is graceful by construction.

- **jsdom does not implement `<datalist>` dropdown behavior**, so the browser-facing behavior is not unit-testable. → **Mitigation:** tests cover what is testable — the pure ranking selector against real Yjs-seeded state, the pure filter function, and the `list`/`datalist` DOM wiring in the form. The presentation itself is verified manually.

- **Corpus size.** A doc-wide walk over every entry in every book runs on each doc transaction. Even a decade of books is a few thousand short strings; the walk is a single linear pass and the result is `shallowEqual`-stable, so re-renders are rare. Not a concern at realistic scale.

## Open Questions

None. Year-cutoff (all books), ranking (frequency, recency tiebreak), and the diacritics trade-off were all settled during exploration.
