## Why

The dashboard's "latest book" card is a weak shortcut — it always points to the highest-year book regardless of what the user actually works on. Users need a way to pin the books they care about and reach them quickly, especially on mobile where the stats block pushes content far down the page.

## What Changes

- Add `favorite: boolean` field to the `Book` schema (defaults to `false`)
- Add a favorite toggle button (star) to each book row in the book library
- Favorite books float to the top of the book library list (sorted by year desc within favorites)
- Remove the "latest book" card from the dashboard
- Add a "Favorite books" section to the dashboard, always visible (empty state prompts the user to star a book when none are favorited)
- Dashboard top row: favorites card + all-time total card in a 2-column grid, above the primary stats grid and bar chart

## Capabilities

### New Capabilities

- `book-favorites`: Ability to mark books as favorite, surface them at the top of the book library and on the dashboard

### Modified Capabilities

- `book-library`: Book rows gain a favorite toggle; list renders favorites first
- `dashboard`: Replaces "latest book" card with a conditional favorites section; responsive order applied to that section

## Impact

- `src/books/book-schema.ts` — add `favorite` field
- `src/books/books-storage.ts` — schema migration: existing stored books default `favorite` to `false`
- `src/books/book-library.tsx` — favorite toggle in `BookRow`, split sorted list into favorites-first
- `src/dashboard/dashboard-page.tsx` — remove latest book card, add `FavoriteBooks` component (always rendered, empty state when no favorites), pair with `AllTimeTotalCard` in a 2-col top grid
- Tests for book-library and dashboard-page need updating
