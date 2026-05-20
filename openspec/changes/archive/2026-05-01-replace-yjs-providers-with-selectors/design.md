## Context

AutoKPO now keeps app state in a single Yjs `Y.Doc`, but several feature areas still wrap Yjs reads and writes in React context providers that were shaped by the pre-Yjs architecture. `BooksProvider` materializes the whole books collection, including nested entries, profile, and signature data, and `BookScope` narrows back down to one active book afterward. `EntityProfileProvider`, `SignatureProvider`, and `EntriesProvider` each add another provider layer even though their values are already derivable from Yjs selectors.

This creates three problems:

- reads are broader than necessary, so unrelated document updates can force expensive selector recomputation;
- the architecture hides the real store boundary, because Yjs is the source of truth but provider contexts still look like primary state containers;
- tests and agent guidance still point contributors toward provider-oriented wiring instead of selector/mutation seams.

The change spans CRDT utilities, book-scoped feature modules, routed consumers, tests, and app-specific guidance. It also introduces a rule that `useYDoc` defaults to `shallowEqual`, which makes selector output shape part of the architecture rather than a per-call optimization.

## Goals / Non-Goals

**Goals:**

- Move Yjs-backed feature access from provider/context wrappers to entity-scoped selector and mutation modules.
- Keep router concerns at the route boundary via a small `useBookId()` hook.
- Make `useYDoc` default to `shallowEqual` and require selectors to return shallow-friendly projections.
- Establish a canonical Stage 1 migration that less powerful agents can repeat without redesigning the pattern.
- Replace provider-oriented tests with selector/mutation unit tests and UI integration tests seeded with real Yjs state.
- Update `apps/app/CLAUDE.md` and `apps/app/AGENTS.md` to reflect the new architecture and testing policy.

**Non-Goals:**

- Rework the singleton Yjs document lifecycle or move document creation into React ownership.
- Change user-visible profile, signature, entry, book, wizard, or PDF behavior except where required to preserve the same behavior through the new state access pattern.
- Replace Yjs, React Router, or the sync engine.
- Update root repository guidance files.

## Decisions

### Use entity-scoped selector and mutation namespaces

Each Yjs-backed domain module will expose pure selector and mutation namespaces such as `bookSelectors`, `bookMutations`, `profileSelectors`, `profileMutations`, `signatureSelectors`, `signatureMutations`, `entrySelectors`, and `entryMutations`.

Rationale:

- keeps read and write logic near the owning entity instead of mixing it into UI components or one large CRDT helper module;
- scales better than a single `bookSelectors` catch-all because profile, signature, and entry concerns can evolve independently;
- makes unit tests straightforward: pass a fresh doc to a mutation, then assert selector output.

Alternatives considered:

- Keep provider hooks and only optimize internals: rejected because the provider layer would still obscure the Yjs store boundary.
- Use hook-only wrappers like `useProfile()` and `useProfileMutations()`: rejected as the primary abstraction because pure functions are easier to test and reuse; hooks can remain thin glue where needed.

### Keep `useBookId()` as the route boundary

Book-scoped UI will use `useBookId()` for route param lookup and validation, then pass the resulting id to selector factories such as `useYDoc(bookSelectors.setupState(bookId))`.

Rationale:

- keeps routing concerns separate from data selection;
- avoids repeating `useParams()` and param validation at every call site;
- avoids over-coupling selectors to React Router.

Alternatives considered:

- Inline `useParams()` everywhere: rejected as repetitive and inconsistent.
- Introduce `useCurrentBook()`-style data hooks: rejected because they hide both routing and selection policy behind one abstraction.

### Make `useYDoc` default to `shallowEqual`

`useYDoc` will treat `shallowEqual` as the default comparator when the caller omits `isEqual`.

Rationale:

- `useSyncExternalStoreWithSelector` only applies custom selection equality when `isEqual` is provided; otherwise a selector that returns fresh references re-renders after every changed snapshot;
- a shallow default turns selector output shape into an explicit contract across the app;
- it removes repetitive per-call comparator wiring once selectors are designed correctly.

Alternatives considered:

- Keep `Object.is` semantics by omitting `isEqual`: rejected because it would let broad selectors accidentally churn on fresh object or array references.
- Keep `deepEqual` as the common comparator: rejected because it compensates for over-broad selector outputs instead of forcing selectors to return small, flat projections.

### Design selectors to be shallow-friendly by default

Selectors should return primitives, flat objects, or minimal arrays of flat items whenever possible. Broad nested materialization becomes the exception instead of the default path.

Rationale:

- aligns selector design with the `shallowEqual` default;
- narrows rerender scope by returning only what each screen needs;
- makes selector cost easier to reason about than parsing full `Book` objects for every consumer.

Alternatives considered:

- Continue returning full parsed books from most read paths: rejected because it preserves the current over-selection problem.

### Use pure mutation functions that accept the doc instance

Mutations will be expressed as domain commands such as `bookMutations.create(ydoc, input)` or `profileMutations.save(ydoc, bookId, profile)`, each wrapping its writes in `ydoc.transact(() => { ... })`.

Rationale:

- keeps React out of domain logic;
- makes mutation tests cheap and explicit;
- mirrors selector namespaces cleanly.

Alternatives considered:

- Keep write helpers hidden inside providers: rejected because provider removal is the purpose of the change.
- Use mutation hooks as the primary API: rejected because that would reintroduce React-specific seams where pure functions are enough.

### Test the domain directly and the UI through real wiring

Selectors and mutations will receive direct unit tests. UI tests will seed real Yjs state, render components with real selectors and mutations, and assert user-visible behavior without mocking selector or mutation modules.

Rationale:

- verifies the new architecture at the right seam;
- avoids low-value UI tests that only assert mocked function calls;
- lets one canonical migrated provider demonstrate the pattern for future contributors and agents.

Alternatives considered:

- Keep provider-oriented integration tests or mock selectors/mutations in UI tests: rejected because they would not exercise the real Yjs wiring.

### Roll out in two stages

Stage 1 establishes the reference implementation: app-specific guidance updates, `useYDoc` default comparator change, and one end-to-end provider migration that demonstrates selectors, mutations, and tests.

Stage 2 is a routine rollout of the same pattern to the remaining providers and consumers.

Rationale:

- separates design-defining work from repeatable migration work;
- gives weaker agents a golden path to follow;
- reduces the risk of proliferating inconsistent abstractions.

Alternatives considered:

- Migrate every provider in one undifferentiated pass: rejected because early mistakes would be copied everywhere.

## Risks / Trade-offs

- **Selector outputs stay too broad** → Mitigation: document shallow-friendly selector rules in app guidance and enforce them in the Stage 1 reference migration.
- **Existing specs hard-code provider/context language** → Mitigation: update the affected capability specs so they describe selector/mutation access instead of provider internals.
- **Routine rollout drifts from the reference implementation** → Mitigation: split work into Stage 1 and Stage 2, and tell Stage 2 to follow the Stage 1 pattern without inventing new abstractions.
- **UI tests become cumbersome if seeded state is inconsistent** → Mitigation: rely on a small number of realistic Yjs fixtures/helpers and keep exhaustive edge cases in selector/mutation unit tests.
- **Some consumers still need broad list projections** → Mitigation: allow explicit list selectors such as a lightweight `bareList`, but keep them flat and scoped to the data each screen actually displays.

## Migration Plan

1. Update `useYDoc` to default to `shallowEqual` and align related tests with the new comparator contract.
2. Add `useBookId()` as the route-boundary helper for book-scoped screens.
3. Choose one provider migration as the Stage 1 reference implementation, preferably a smaller per-book provider such as entity profile or signature.
4. Introduce entity-scoped selector and mutation modules for that reference path, then update its UI consumers and tests.
5. Update `apps/app/CLAUDE.md` and `apps/app/AGENTS.md` to encode selector-first reads, mutation namespaces, and the new testing policy.
6. Roll the pattern out to the remaining providers and consumers in Stage 2, then remove obsolete provider code and provider-specific tests.

Rollback strategy: the migration is internal to the app codebase. If Stage 1 proves the pattern is unsound, the change can stop before Stage 2 and retain the remaining providers unchanged.

## Open Questions

- Which provider should be the canonical Stage 1 migration: entity profile or signature? The design leans toward entity profile because it is slightly richer while still small.
- Whether `BooksProvider` should disappear entirely in Stage 2 or survive temporarily as a thin hook-backed compatibility layer while list consumers are converted.
