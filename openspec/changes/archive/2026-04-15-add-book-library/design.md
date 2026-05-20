## Context

Today the app is a single-book tool: one profile, one signature, one entries array, stored under flat `localStorage` keys and wired through three independent React contexts. `App` branches on `profile && signature ? WorkingLayout : SetupWizard`. There is no routing library and no notion of a collection of documents.

Serbian tax rules treat each calendar year as its own KPO book. To let users keep multiple years side by side, we need to introduce a **library** layer that owns a collection of books and promotes one of them to "active" at a time. Downstream features (profile, signature, entries, PDF export) then operate transparently on the active book.

This is a significant refactor — roughly every module touches data storage — so the design emphasizes keeping the existing provider/context shape and pushing the multi-book concern up into a new active-book scope, rather than rewriting each feature to know about books.

## Goals / Non-Goals

**Goals:**

- Preserve the existing context-based architecture; downstream features stay blissfully unaware of the book collection and read "the active profile / signature / entries" as they do today
- One book per calendar year, enforced in the UI (year picker) and in the schema
- Library is the default landing page after the app loads
- A freshly created book may be empty and incomplete; users can leave and resume setup at any time
- Zero data migration — legacy storage keys are retired cleanly since the app is unreleased

**Non-Goals:**

- No cross-book operations (merging, copying entries across years, carry-over of opening balances)
- No mid-year "close book and start a new one with different header" flow — deferred; users can regenerate PDFs if header data changes
- No cloud sync, export-all, or import — `localStorage` remains the sole persistence

## Decisions

### Data model: a single `kpo:books` key, array of self-contained books

```ts
type BookId = string; // uuid v4

type Book = {
  id: BookId;
  year: number; // 4-digit calendar year; unique across books
  profile: EntityProfile | null;
  signature: Signature | null;
  entries: KpoEntry[];
  createdAt: string; // ISO timestamp
};

// localStorage["kpo:books"] = JSON.stringify(Book[])
```

**Why one array key** over per-book keys (`kpo:book:<id>:profile`, etc.):

- Straightforward enumeration for the library listing (one read, no key scanning)
- Atomic writes — no partial-state hazards when deleting a book
- Volume is tiny: even power users will have <10 books of <1000 entries each
- Matches the "single Zod schema validates the whole storage blob" pattern already used for entries

Trade-off: every entry write rewrites the whole blob. Acceptable at this scale; revisit if we ever hit perceptible latency.

**Why `id` separate from `year`**: year is a human-facing uniqueness key, but using it as the primary identifier makes rename/correction flows awkward and couples storage to a potentially mutable field. A stable `id` keeps year as data.

### Routing: `react-router-dom` with book id in the URL

A new dependency `react-router-dom` (v7, data-router style with `createBrowserRouter`) introduces URL-addressable screens:

```
/                   → <BookLibrary />
/books/:bookId      → <BookScope /> → SetupWizard or WorkingLayout (based on completeness)
```

`BookScope` reads `:bookId` from `useParams()`, resolves the book from storage, and mounts the book-scoped providers. If the id is missing / unknown (e.g., deleted in another tab), `BookScope` calls `navigate('/', { replace: true })` so the user lands on the library with no dangling state.

Navigation is driven by `useNavigate()`:

- Library "Open book" → `navigate('/books/<id>')`
- Library "Add book" → create empty book, then `navigate('/books/<id>')`
- Setup/working "Back to library" → `navigate('/')`

**Why react-router-dom**:

- Browser back/forward behave as users expect (the current state-based approach breaks them)
- Deep links let users bookmark a specific year
- Reloading the page on a working book preserves context instead of dumping the user back to the library
- PWA install + re-open behaves consistently with the last URL

**Alternative considered**: state-driven navigation (the original plan). Rejected — the library/setup/working trio is exactly the kind of multi-screen flow routers exist for, and the cost is one small dependency.

**Version pinning**: target `react-router-dom@^7`; React 19 and React Compiler are both supported. Confirm via Context7 at implementation time — see Open Questions.

### Downstream contexts stay unchanged in shape; storage becomes book-scoped

`EntityProfileContext`, `SignatureContext`, and `EntriesContext` keep their existing public API (`profile`, `signature`, `entries`, setters). What changes is the provider implementation:

- Providers now read/write through the active book inside `kpo:books` instead of their own top-level keys
- Providers require an `activeBookId` from context; if none is active, the providers are never mounted (the app branches to `<BookLibrary />`)

This means `EntityProfilePreview`, `EntryModal`, `DownloadPdfButton`, and every existing test continue to work verbatim — they only ever see "the current thing". The multi-book complexity is confined to one layer.

Concretely, `entity-profile-storage.ts` exports `getProfile(bookId)` / `saveProfile(bookId, profile)`; `EntityProfileProvider` reads `activeBookId` from context and wires those calls. Same for signature and entries.

**Alternative considered**: pass the whole `Book` object through context. Rejected — it forces every consumer to reach through `.profile` / `.entries`, multiplying the diff and breaking existing tests for no gain.

### Component hierarchy

```
<RouterProvider>
  <BooksProvider>                            (owns books[] list + CRUD, shared across routes)
    Route "/"              → <BookLibrary />
    Route "/books/:bookId" → <BookScope>
                                └── <EntityProfileProvider bookId>
                                      └── <SignatureProvider bookId>
                                            └── <EntriesProvider bookId>
                                                  ├── [incomplete] <SetupWizard />
                                                  └── [complete]   <WorkingLayout />
```

`BooksProvider` owns the authoritative `books` array and its CRUD methods; it sits above the router outlet so both the library and the book-scoped providers can consume the same list. `BookScope` resolves `:bookId` via `useParams`, looks it up in `BooksProvider`, and either passes it down or redirects to `/`.

### Year picker: HeroUI `Select` (DatePicker does not support year-only)

HeroUI v3's `DatePicker` is always day-granular — `granularity` accepts only `"day" | "hour" | "minute" | "second"`. The `Calendar.YearPickerGrid` inside it is a _navigation_ aid to jump between years, not a standalone year-only picker; extracting it into a year-only surface would require rendering a `<Calendar>` with no month grid, which the component was not designed for.

We will use a HeroUI `Select`:

- Options span a rolling range: `currentYear - 10` through `currentYear + 1` (12 options), ordered newest first. This covers practically every preduzetnik's needs — the Pravilnik has been in force since 2005, and an older year is unlikely to be opened for the first time now
- Years already owned by another book appear as disabled `ListBox.Item` entries with a "(zauzeto)" suffix, e.g. `2024 (zauzeto)`
- No default selection — the user actively picks a year. Submit is always enabled; on submit with no selection the field shows the Serbian inline error `"Polje je obavezno"`, matching existing form-validation copy in the app (e.g., entity-profile, entry forms)
- Occupied years are disabled options and can't be selected; the submit path therefore doesn't need a separate "selected year is occupied" error
- If every year in the default range is occupied (very unlikely — that's 12 books), the list still renders and the user sees all years as disabled; we can widen the range later if this ever becomes a real case

### Add-book form validation: React Hook Form + Zod

**Decision**: The `AddBookDialog` form uses React Hook Form with `zodResolver` (same stack as `EntityProfileForm`, `SignatureForm`, and `EntryForm`). The schema is a minimal `z.object({ year: z.string().min(1, ...) })` — year is stored as a string key because HeroUI `Select` operates on string keys; it is coerced to `number` in the submit handler before calling `createBook`.

**Rationale**: Consistency across all forms in the codebase. Eliminates the `useState`-based `selected`/`error` pair and manual early-return validation in favour of the established RHF+Zod pattern. A `Controller` wraps the `Select`, binding `selectedKey`/`onSelectionChange` to `field.value`/`field.onChange`.

---

**Alternatives considered:**

1. **`NumberField`** — keyboard-friendly and unbounded, but requires inline "already occupied" validation and doesn't visually communicate the set of available years at a glance
2. **Custom standalone year-grid using `Calendar.YearPickerGrid`** — would require forcing `Calendar` into a year-only mode the public API doesn't expose. Fragile
3. **`DatePicker` with month granularity** — not supported (no `"month"` granularity)

`Select` wins on discoverability: the user immediately sees which years are available vs. taken, and there's no typing required on mobile.

### Remove book: destructive confirmation

"Remove book" opens a HeroUI confirmation dialog showing the year and entry count ("Obrisati knjigu za 2025 (42 unosa)? Ovu radnju nije moguće poništiti."). Confirm deletes; cancel dismisses. The action is only exposed on the library (no delete from inside a book), so the route is always `/` when a deletion happens and no navigation fallback is required.

### Resume logic lives in the wizard, not the library

When the user opens a book:

- If profile or signature is missing → `<SetupWizard />` renders; the wizard already skips completed steps, so it lands on the first incomplete one
- If both are present → `<WorkingLayout />` renders directly

The library doesn't need to distinguish "empty" vs "in progress" vs "done" books — all three are just "open this book, the downstream screen figures out what to show". The library may still display a subtle status badge (e.g., "Nezavršeno" when setup is incomplete) as a UX affordance, but it drives no routing logic.

## Risks / Trade-offs

- **Blast radius**: every existing feature test touches storage. Mitigation: keep provider APIs unchanged; update only the storage layer (now accepts `bookId`) and add the `BooksProvider`/`BookScope` wiring in a minimal number of places
- **Schema drift**: moving data under `kpo:books` means a Zod parse failure on boot leaves the app with an empty library and no recovery UI. Mitigation: on parse failure, log to console and fall back to `[]`, matching existing `entries-storage.ts` behavior. A catastrophic corruption is unrecoverable — no worse than today
- **Year conflicts across tabs**: two tabs could both create a book for 2025 before either writes. Mitigation: check-then-write is racy but the cost is low (a duplicate year, easily deleted). Not worth adding `storage` events or locks for a single-user local app
- **Router + PWA**: `createBrowserRouter` requires the server/PWA fallback to serve `index.html` for `/books/:id`. Mitigation: the existing Vite PWA setup already serves the SPA fallback; verify the service worker's navigation fallback entry covers `/books/*` during implementation
- **Empty-book UX**: creating a book and bailing before saving profile leaves an empty book in the library. By design — the user can resume. Library shows a "Nezavršeno" badge so this is not surprising

## Open Questions

- **`react-router-dom` version**: target v7. Confirm via Context7 during implementation that v7 is compatible with React 19 and React Compiler, and settle the exact minor. If v7 has incompatibilities, fall back to v6 — the API surface we use (`createBrowserRouter`, `RouterProvider`, `useParams`, `useNavigate`, `Navigate`) is identical on both
- **Base URL**: if deployed under a sub-path (GitHub Pages, etc.), `createBrowserRouter({ basename })` needs the Vite `base` value. Check `vite.config.ts` at implementation
- **Library status badge copy**: "Nezavršeno" is a plausible label but should be confirmed with the product/translator pass
