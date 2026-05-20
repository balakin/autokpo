## 1. Dependencies and routing skeleton

- [x] 1.1 Add `react-router-dom@^7` to `package.json` via `pnpm add`; confirm React 19 + React Compiler compatibility via Context7
- [x] 1.2 Create `createBrowserRouter` with routes `/` → `<BookLibrary />` and `/books/:bookId` → `<BookScope />`; add a catch-all `Navigate to="/" replace`
- [x] 1.3 Wrap `<App />` with `<RouterProvider>` in `src/main.tsx`; delete the conditional-render logic currently in `src/app.tsx`
- [x] 1.4 Verify Vite PWA `navigateFallback` covers `/books/*` so deep links work offline

## 2. Books module and storage

- [x] 2.1 Create `src/books/` with files: `book-schema.ts`, `books-storage.ts`, `books-context.ts`, `books-provider.tsx`, `use-books.ts`
- [x] 2.2 Define `bookSchema` in Zod (`id`, `year`, `profile`, `signature`, `entries`, `createdAt`); import and reuse the existing `entityProfileSchema`, `signatureSchema`, and `kpoEntrySchema`
- [x] 2.3 Implement `getBooks()` / `saveBooks()` in `books-storage.ts` under key `kpo:books`; on parse failure fall back to `[]`
- [x] 2.4 Implement `BooksProvider` exposing `books`, `createBook(year)`, `removeBook(id)`, `getBookById(id)`, `updateBook(id, patch)`; mount it above the router outlet
- [x] 2.5 `createBook` SHALL throw when the year is already occupied
- [x] 2.6 Add unit tests for storage + provider (uniqueness, persistence, empty/corrupt fallback)

## 3. Book-scoped providers for existing features

- [x] 3.1 Change `entity-profile-storage.ts` from top-level-key access to `getProfile(bookId)` / `saveProfile(bookId, profile)` that read/write through `BooksProvider` (or inject the update callback)
- [x] 3.2 Update `EntityProfileProvider` to accept `bookId` (from `BookScope`) and read/write via `BooksContext`; keep the public `EntityProfileContext` shape unchanged
- [x] 3.3 Repeat 3.1–3.2 for `signatures/signature-storage.ts` and `SignatureProvider`
- [x] 3.4 Repeat 3.1–3.2 for `entries/entries-storage.ts` and `EntriesProvider`
- [x] 3.5 Delete all references to legacy keys `kpo:entity-profile`, `kpo:signature`, `kpo:entries` across source and tests
- [x] 3.6 Update existing tests in `entity-profiles/__tests__`, `signatures/__tests__`, `entries/__tests__` to mount providers inside a mock `BooksProvider` with an active book

## 4. `BookScope` route component

- [x] 4.1 Create `src/books/book-scope.tsx` that reads `bookId` via `useParams`, resolves the book via `BooksContext`
- [x] 4.2 On unknown id: render `<Navigate to="/" replace />`
- [x] 4.3 On known id: mount `<EntityProfileProvider bookId>` → `<SignatureProvider bookId>` → `<EntriesProvider bookId>` → child router outlet
- [x] 4.4 Inside the providers, branch on `profile && signature ? <WorkingLayout /> : <SetupWizard />`
- [x] 4.5 Add a test: unknown id redirects; known id renders wizard or working layout based on completeness

## 5. Library page

- [x] 5.1 Create `src/books/book-library.tsx` — list of books sorted by year desc, empty state copy in Serbian, "Add book" button, per-row "Open" and "Remove" actions, "Nezavršeno" badge for incomplete books
- [x] 5.2 "Open" uses `useNavigate()` to go to `/books/<id>`
- [x] 5.3 "Remove" opens an HeroUI confirmation dialog showing year and entry count; confirm calls `removeBook(id)`
- [x] 5.4 Tests: renders empty state; renders multiple books newest-first; open navigates; remove confirms then deletes; incomplete badge visibility

## 6. Add-book modal with year selector

- [x] 6.1 Create `src/books/add-book-modal.tsx` with a HeroUI `Modal` containing a HeroUI `Select`, a cancel button, and a submit button
- [x] 6.2 Year options: range `(currentYear + 1)` down to `(currentYear − 10)`, newest first; years occupied by existing books are rendered as disabled `ListBox.Item`s with a "(zauzeto)" suffix
- [x] 6.3 No default selection; on submit without selection show the inline error "Polje je obavezno" on the Select — implemented via React Hook Form + Zod (`Controller` wraps `Select`; schema: `z.object({ year: z.string().min(1, ...) })`)
- [x] 6.4 On valid submit: call `createBook(year)`, close the modal, `navigate('/books/<id>')`
- [x] 6.5 Tests: option rendering, occupied years disabled, required-error behavior, successful create-and-navigate

## 7. Back-to-library affordance

- [x] 7.1 Add a visible "Back to library" button/link to `WorkingLayout` that calls `navigate('/')`
- [x] 7.2 Add a visible "Back to library" button/link to `SetupWizard` that calls `navigate('/')`
- [x] 7.3 Tests: clicking the button from each view lands on the library

## 8. PDF export scoping

- [x] 8.1 Confirm `DownloadPdfButton` consumes only the book-scoped contexts (no direct storage reads); fix any direct reads
- [x] 8.2 Test: generating a PDF while viewing book A includes only A's data when B also exists

## 9. Final polish and verification

- [x] 9.1 Run `pnpm lint:fix`; resolve any remaining eslint errors
- [x] 9.2 Run `pnpm test` (full suite) and fix regressions
- [x] 9.3 Run `pnpm build` and verify it succeeds
- [x] 9.4 Manual smoke test: create book → wizard → working layout → back to library → remove → confirm browser back/forward and reload behave correctly on `/books/<id>`
