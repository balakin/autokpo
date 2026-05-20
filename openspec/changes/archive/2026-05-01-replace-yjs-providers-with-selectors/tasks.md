## 1. Stage 1 Reference Implementation

- [x] 1.1 Update `apps/app/CLAUDE.md` and `apps/app/AGENTS.md` to document selector-first Yjs reads, entity-scoped mutation namespaces, shallow-equality-friendly selector design, and the testing policy for unit vs UI integration coverage.
- [x] 1.2 Update `src/crdt/use-y-doc.ts` so `useYDoc` defaults to `shallowEqual`, and revise CRDT hook tests to verify the new default behavior.
- [x] 1.3 Add `useBookId()` as the route boundary for book-scoped UI and convert the first consumer path to use it.
- [x] 1.4 Migrate one per-book provider path into selector and mutation modules as the canonical example, including its routed consumers and obsolete provider code.
- [x] 1.5 Add or rewrite tests for the canonical example so selectors and mutations are unit-tested directly and UI tests use real Yjs-seeded state without mocking selector or mutation modules.

## 2. Stage 2 Routine Rollout

- [x] 2.1 Migrate the remaining per-book provider paths to entity-scoped selector and mutation modules using the Stage 1 pattern without introducing new abstractions.
- [x] 2.2 Convert remaining book-scoped and list consumers from provider hooks to `useYDoc` selectors plus pure mutation calls.
- [x] 2.3 Remove obsolete provider components, contexts, hooks, and provider-specific tests after their consumers have been migrated.
- [x] 2.4 Align integration tests across migrated screens so they seed real Yjs state and assert visible behavior through the new selector/mutation wiring.
