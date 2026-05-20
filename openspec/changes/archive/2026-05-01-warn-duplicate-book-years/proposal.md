## Why

The app allows offline creation on multiple devices, so concurrent edits can produce duplicate books for the same year after sync. This breaks the one-book-per-year expectation and can confuse users unless the duplication is clearly surfaced.

## What Changes

- Add duplicate-year detection in the book library view based on current Y.Doc state.
- Show a persistent warning alert when duplicate years are present.
- Render the warning details as a bullet list with every affected year and duplicate count.
- Show a per-row warning tag next to each book year when that row belongs to a duplicated year.
- Keep current behavior for create/open/favorite/delete actions (no blocking or auto-merge in this iteration).

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `book-library`: Add explicit requirements for duplicate-year warnings (global alert + per-row tag) when sync produces more than one book for the same year.

## Impact

- Affected code: `apps/app/src/books/book-selectors.ts`, `apps/app/src/books/book-library.tsx`, and related tests in `apps/app/src/books/__tests__/`.
- APIs and sync transport: no protocol or backend schema changes.
- Dependencies: no new runtime dependencies expected.
