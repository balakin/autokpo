## Context

The earlier Yjs migration replaced the per-book profile, signature, and entry providers with selector and mutation modules, but `BooksProvider` still sits above the router and materializes full `Book[]` snapshots for the whole app. Consumers such as `BookLibrary`, `BookScope`, `TopBar`, `AddBookModal`, `DashboardPage`, `useStats`, and shared test helpers still rely on that provider even when they only need small slices like occupied years, a breadcrumb year, or setup completeness.

This makes `books` the last broad provider-backed read surface in the app. It also keeps some specs coupled to implementation details that are about to disappear, such as the dashboard requirement referring to `useBooks()` and localStorage.

## Goals / Non-Goals

**Goals:**

- Remove the runtime dependency on `BooksProvider`, `BooksContext`, and `useBooks()`.
- Replace broad `Book[]` reads with purpose-built selectors that match the needs of each books consumer.
- Keep writes in pure `bookMutations` functions that accept the Yjs doc and perform one transaction per command.
- Align books tests and test helpers with the selector/mutation architecture.
- Clean up affected specs so they describe stable behavior or architecture, not transient hook names.

**Non-Goals:**

- Change user-visible book, dashboard, setup, or breadcrumb behavior.
- Redesign the Yjs document structure for books, entries, profiles, or signatures.
- Revisit the already-migrated profile, signature, or entry selector APIs except where books consumers compose them.
- Introduce a new compatibility provider layer.

## Decisions

### Remove the books provider instead of preserving a compatibility hook

The change will delete the provider/context path rather than reimplementing `useBooks()` on top of selectors.

Rationale:

- finishing the migration requires removing the abstraction that still makes Yjs look secondary;
- a compatibility hook would preserve the old mental model and risks becoming permanent;
- the remaining consumers are few enough to migrate directly.

Alternatives considered:

- Keep `useBooks()` as a thin facade over selectors: rejected because it keeps broad read shapes and provider-era semantics alive.

### Use narrow selector families instead of one generic `Book[]` selector

The books domain will expose several read models rather than a single canonical full-book list. Expected selectors include route-scoped book state, library rows, occupied years, breadcrumb data, favorites, and stats-oriented projections.

Rationale:

- most consumers do not need full `Book` materialization;
- narrow selectors fit the `useYDoc` shallow-equality contract better than nested `Book[]` snapshots;
- each screen can subscribe only to the fields it actually renders.

Alternatives considered:

- Replace `useBooks()` with `useYDoc(bookSelectors.all())`: rejected because it would mostly preserve the current over-selection problem.

### Keep book writes as explicit domain commands

Book creation, removal, favorite toggling, and any remaining field updates will live in `bookMutations` functions that accept the doc instance and wrap writes in `ydoc.transact(() => { ... })`.

Rationale:

- mirrors the existing profile/signature/entry pattern;
- keeps React concerns out of domain writes;
- makes domain tests straightforward.

Alternatives considered:

- Put writes into component-local callbacks or custom hooks: rejected because it spreads Yjs mutation logic across UI code.

### Migrate tests through the same seam the app uses

Provider-oriented books tests and test wrappers will be replaced by selector/mutation unit tests and UI integration tests seeded with real Yjs state.

Rationale:

- verifies the final architecture rather than a compatibility shell;
- removes `BooksProvider` from shared test setup so new tests do not regress to the old pattern;
- matches the testing style already adopted for other Yjs-backed domains.

Alternatives considered:

- Keep provider tests and only add a few selector tests: rejected because it would preserve dead architecture in the test suite.

## Risks / Trade-offs

- Broad selectors could reappear under new names -> Mitigation: define selectors around concrete consumers and avoid a generic full-book read unless a caller genuinely needs it.
- Stats consumers may still want nested entry data -> Mitigation: give stats its own projection shape instead of routing all dashboards through the library row selector.
- Shared test helpers may hide missing migration work -> Mitigation: remove provider mounting from common helpers as part of the same change.
- Spec cleanup may drift into design detail again -> Mitigation: keep spec deltas limited to durable contracts and move selector naming into this design only.

## Migration Plan

1. Introduce `bookSelectors` and `bookMutations` that cover existing books consumers.
2. Migrate `BookScope`, `TopBar`, `AddBookModal`, `BookLibrary`, `DashboardPage`, and `useStats` to those selectors and mutations.
3. Update app bootstrap and test helpers to stop mounting `BooksProvider`.
4. Replace provider-centric books tests with selector/mutation tests plus Yjs-seeded UI integration tests.
5. Remove obsolete books provider files and any helper exports that only exist to support them.

Rollback strategy: the migration is internal to the app. If the selector surface proves awkward during implementation, the branch can stop before deleting the provider files and regroup around a narrower slice of consumers.

## Open Questions

- Should stats consume a dedicated projection tailored to `computeStats`, or should a single books selector feed both dashboard lists and stats? The design leans toward a dedicated stats projection to avoid overloading one selector shape.
