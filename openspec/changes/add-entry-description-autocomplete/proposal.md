## Why

KPO entries are highly repetitive — the same handful of clients and service descriptions recur month after month, year after year. Today users retype or copy those descriptions by hand, or open an old book just to look one up. The descriptions are already in the document; we should offer them back.

## What Changes

- The entry form's **Opis prometa** field gains native browser autocomplete backed by an HTML `<datalist>`, suggesting descriptions the user has entered before.
- Suggestions are drawn from **every book in the document**, not just the book being edited — so descriptions from previous years are offered alongside the current year's.
- Suggestions are ranked by **frequency** (how many entries share that description), with **recency** (latest `datumPrometa`) as the tiebreak, deduplicated case-insensitively, and capped at **5**.
- Suggestions appear only once the user has typed at least one character; matching is a case-insensitive substring match.
- No custom dropdown or autocomplete component is introduced. The existing HeroUI `TextField`/`Input`, React Hook Form wiring, Zod validation, styling, and accessibility semantics are preserved — the field gains a `list` attribute and nothing else.

Not a breaking change. No stored data changes; this is a read-only projection over existing entries.

## Capabilities

### New Capabilities

None. This extends an existing capability rather than introducing a new one.

### Modified Capabilities

- `entry-management`: the Opis prometa field gains autocomplete suggestions sourced from prior entries across all books. Adds requirements covering suggestion sourcing, ranking, deduplication, the 5-item cap, the minimum-one-character trigger, and selection behavior.

## Impact

- `apps/app/src/entries/entry-form.tsx` — the `opisPrometa` `Controller` renders a `<datalist>` and passes `list` to `Input`; watches the field value to compute matches.
- `apps/app/src/entries/entry-selectors.ts` — new doc-wide selector producing the ranked, deduplicated description corpus. This is the first entry selector that reads across all books rather than one book; `bookSelectors.statsBooks` is the existing precedent for a doc-wide entry walk.
- `apps/app/src/entries/` — new pure module for the query-time filter (substring match + cap).
- Tests: new unit tests for the selector (real Yjs-seeded state) and the filter; entry-form test asserts the `list`/`datalist` wiring.
- No worker, schema, migration, or dependency changes. No new user-facing strings, so no `.po` churn expected.
