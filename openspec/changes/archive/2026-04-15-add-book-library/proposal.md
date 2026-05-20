## Why

The KPO ledger is legally organized as one book per calendar year. Today the app stores a single profile, signature, and entry set globally, so it can only produce one book at a time — whichever year the user mentally attaches to the current data. Preduzetnici working across tax years (the normal case: a fresh book opens each January 1) have no way to keep prior years accessible alongside the current one without clearing data. A library of year-scoped books matches how tax authorities expect records to be kept and lets users return to any year to reprint or correct it.

## What Changes

- **NEW**: Library page listing all books, grouped/sorted by year (newest first), with empty state when no books exist
- **NEW**: "Add book" button opens a modal with a year picker; submitting creates an empty book and routes into the setup wizard for that book
- **NEW**: "Open book" action on each library entry loads the book into the working layout — or resumes the setup wizard if profile/signature are incomplete for that book
- **NEW**: "Remove book" action with confirmation; permanently deletes the book and all its entries
- **NEW**: "Back to library" affordance from both setup wizard and working layout
- **NEW**: Year-uniqueness constraint — exactly one book per calendar year; the year picker disables years already occupied
- **BREAKING**: Single-book data model replaced by a multi-book library. Profile, signature, and entries are scoped to a specific book (keyed by book id). Legacy storage keys (`kpo:entity-profile`, `kpo:signature`, `kpo:entries`) are removed outright — the app is unreleased, so no migration is required
- **MODIFIED**: `App` renders the Library by default; it renders `SetupWizard` or `WorkingLayout` only when a book is active
- **MODIFIED**: PDF export reads the active book

## Capabilities

### New Capabilities

- `book-library`: Library view, year-picker modal, book-list rendering, add/remove/open actions, year-uniqueness enforcement, and multi-book storage

### Modified Capabilities

- `working-layout`: Top-level app routing now defaults to the library; setup and working layouts are scoped to an active book; both expose a back-to-library action
- `entity-profile`: Profile persistence is scoped to a book id; the profile context exposes the active book's profile
- `signature`: Signature persistence is scoped to a book id; the signature context exposes the active book's signature
- `entry-management`: Entry persistence is scoped to a book id; `EntriesContext` exposes the active book's entries
- `setup-wizard`: The wizard operates on the active (freshly created) book; closing the wizard returns to the library without losing the empty book
- `pdf-export`: Export uses the active book's profile, signature, and entries

## Impact

- New module `src/books/` — active-book context, multi-book storage, library page, year-picker modal
- `src/app.tsx` — routes between library, setup wizard, working layout based on active-book state
- `src/working-layout/working-layout.tsx` — consumes active book; adds back-to-library button
- `src/setup-wizard/setup-wizard.tsx` — consumes active book; adds back-to-library exit
- `src/entity-profiles/entity-profile-storage.ts` — keyed by book id; provider reads the active book
- `src/signatures/signature-storage.ts` — same
- `src/entries/entries-storage.ts` — same
- `src/pdf/` — sources data from the active book
- Tests: new tests for library page, year picker, and active-book routing; existing tests updated for book-scoped contexts
- No new dependencies (HeroUI already provides Modal, Button, Card; year picker can be a numeric select)
