## Why

The `books` domain is still exposed through `BooksProvider`, which materializes broad `Book[]` snapshots for the whole app even though the rest of the Yjs-backed state has already moved to selector-based reads and pure mutations. This keeps the old provider architecture alive in the largest remaining state surface and leaves some specs coupled to implementation details such as `useBooks()`.

## What Changes

- Remove `BooksProvider`, `BooksContext`, and `useBooks()` from the app runtime and replace their consumers with `useYDoc` selectors plus pure `bookMutations` commands.
- Introduce selector-based read models for the main books consumers, including library rows, route-scoped book state, occupied years, breadcrumbs, and dashboard/stat inputs.
- Replace provider-oriented books tests and test helpers with selector/mutation unit tests and UI tests that seed the Yjs document directly.
- Tighten affected specs so they describe durable behavior and architectural contracts instead of specific hooks or provider internals.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `crdt-store`: clarify the selector-first contract for reading and mutating book-backed Yjs state without provider wrappers.
- `dashboard`: remove implementation-specific language that currently ties live dashboard data to `useBooks()` and localStorage.

## Impact

- Affected code: `apps/app/src/books/`, `src/dashboard/`, `src/app-shell/`, `src/stats/`, `src/main.tsx`, and shared test helpers that still mount `BooksProvider`.
- Affected tests: provider-centric books tests will be replaced by selector and mutation unit tests plus integration tests with real Yjs-seeded state.
- Affected guidance: no new guidance files are required, but the change follows the selector-first CRDT architecture already documented in `apps/app/CLAUDE.md`.
