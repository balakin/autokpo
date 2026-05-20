## Context

The dashboard currently shows a "latest book" card that always links to the highest-year book. This is not user-controlled and not useful when a user cares about a different year. The book library shows all books in year-descending order with no way to pin frequently-used ones.

The app is entirely client-side, all state persisted in `localStorage` under `kpo:books`. The `Book` schema is validated with Zod on every read. `BooksProvider` exposes `updateBook(id, patch)` which accepts any `Partial<Omit<Book, 'id'>>` — toggling a field requires no new provider API.

## Goals / Non-Goals

**Goals:**

- Add `favorite` field to `Book` and persist it through `updateBook`
- Toggle button in the book library row
- Favorites-first ordering in the library
- Favorites section on the dashboard, conditionally rendered
- Responsive dashboard layout: favorites first on mobile, after stats on desktop

**Non-Goals:**

- Manual ordering within favorites (year-desc is sufficient)
- A favorites count limit
- Sidebar integration (mobile drawer makes this awkward)
- Syncing favorites across devices

## Decisions

### `favorite` field on the Book model (vs. separate storage key)

Adding `favorite: boolean` directly to `bookSchema` keeps all book state in one place, survives any future export/import feature, and requires no cross-store synchronization. The only cost is a schema migration for existing stored data — handled by defaulting the field to `false` via `z.boolean().default(false)` in the Zod schema.

Alternative considered: a separate `kpo:favorites` localStorage key holding a `Set<id>`. Rejected because it adds sync complexity with no benefit at this scale.

### No new provider API

`updateBook(id, { favorite: true })` is already sufficient. No new action, context method, or custom hook needed.

### Responsive layout: 2-column grid at the top (vs. CSS `order` utilities)

`FavoriteBooks` and `AllTimeTotalCard` are placed together in a `grid grid-cols-1 gap-6 sm:grid-cols-2` row at the very top of the page, above the 4-column stats grid and the bar chart. This is simpler than the originally planned `order-first lg:order-3` approach and avoids splitting logically paired cards across different vertical regions on desktop. The favorites section is always first in both visual and DOM order, which is consistent across breakpoints and friendly to keyboard and screen-reader navigation.

### Dashboard section always renders with an empty state

The `FavoriteBooks` card is always rendered. When no books are favorited, it shows a short prompt ("Označite knjigu zvezdicom u Knjigama da biste je dodali ovde.") with a link to the book library. This is preferable to silent omission because it surfaces the feature to new users who haven't noticed the star toggle yet, and the paired 2-column layout (favorites + all-time total) benefits from always having both cells present.

## Risks / Trade-offs

- **Schema migration on malformed stored data**: If a stored book JSON fails the new schema, `getBooks()` already silently returns `[]` (existing behavior). No additional risk.
- **Layout on very narrow screens**: The top 2-column grid collapses to 1 column below `sm`, stacking favorites above all-time total. This is the intended mobile order.
- **Many favorites fill the dashboard**: No cap is applied. If a user favorites all books, the dashboard shows all of them. This is an intentional choice; it mirrors how the feature was designed.

## Migration Plan

`z.boolean().default(false)` on the `favorite` field means any existing stored book that lacks the field will parse successfully and default to `false`. No explicit migration script needed. On next `saveBooks()` call the field will be written out.
