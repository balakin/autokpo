## 1. Schema & Storage

- [x] 1.1 Add `favorite: z.boolean().default(false)` to `bookSchema` in `src/books/book-schema.ts`
- [x] 1.2 Verify `getBooks()` parses existing stored books without `favorite` field correctly (no code change needed if Zod default handles it — just confirm with a test)

## 2. Book Library — Favorite Toggle

- [x] 2.1 Add a star icon toggle button to `BookRow` in `src/books/book-library.tsx` that calls `updateBook(book.id, { favorite: !book.favorite })`
- [x] 2.2 Style the toggle: filled star (`LuStarOff` / `LuStar`) reflecting current `favorite` state with accessible `aria-label`
- [x] 2.3 Update `BookLibrary` sort logic: favorites first (year desc), then non-favorites (year desc)

## 3. Dashboard — Favorites Section

- [x] 3.1 Remove the "latest book" card from `src/dashboard/dashboard-page.tsx`
- [x] 3.2 Create a `FavoriteBooks` component (can be co-located in `dashboard-page.tsx`) that renders a card list of favorited books, each with year, income summary, and an "Otvori" link
- [x] 3.3 Always render `FavoriteBooks`; show book links when favorites exist, show an empty-state prompt linking to the book library when none exist
- [x] 3.4 Place `FavoriteBooks` and `AllTimeTotalCard` together in a `grid grid-cols-1 gap-6 sm:grid-cols-2` row at the top, above the primary stats grid and bar chart

## 4. i18n

- [x] 4.1 Run `pnpm i18n:extract` to update `.po` files with new strings (star button label, section heading)
- [x] 4.2 Fill in `en` and `ru` translations for all new strings

## 5. Tests

- [x] 5.1 Update `src/books/__tests__/book-library.spec.tsx`: assert favorite toggle button renders, toggling calls `updateBook`, favorited books appear before non-favorited books
- [x] 5.2 Update `src/dashboard/__tests__/dashboard-page.spec.tsx`: assert favorites section renders when favorites exist, is absent when none exist, latest book card is gone
