## 1. Books Domain Selectors And Mutations

- [x] 1.1 Add `bookSelectors` read models for route state, library rows, occupied years, breadcrumb data, favorites, and stats-oriented book projections.
- [x] 1.2 Add `bookMutations` commands for creating, removing, and updating book-backed state through Yjs transactions.
- [x] 1.3 Add direct unit tests for the new books selectors and mutations.

## 2. Consumer Migration

- [x] 2.1 Migrate `BookScope`, `TopBar`, and `AddBookModal` from `useBooks()` to the new selectors and mutations.
- [x] 2.2 Migrate `BookLibrary`, `DashboardPage`, and `useStats` from `useBooks()` to the new selectors and mutations.
- [x] 2.3 Remove `BooksProvider`, `BooksContext`, `useBooks()`, and their runtime wiring from `main.tsx` once all consumers are migrated.

## 3. Tests And Spec Alignment

- [x] 3.1 Update shared render helpers and books UI tests so they seed Yjs state directly without mounting `BooksProvider`.
- [x] 3.2 Remove obsolete provider-centric books tests and replace any remaining coverage gaps with selector/mutation or Yjs-seeded integration tests.
- [x] 3.3 Align the implementation with the new `crdt-store` and `dashboard` spec deltas, preserving existing user-visible behavior.
