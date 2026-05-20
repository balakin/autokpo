## 1. Remove visible headers and add sr-only h1s

- [x] 1.1 In `src/dashboard/dashboard-page.tsx`, remove the icon + h1 heading row and add `<h1 className="sr-only">Panel</h1>` at the top of the page content
- [x] 1.2 In `src/settings/settings-page.tsx`, remove the icon + h1 heading row and add `<h1 className="sr-only">Podešavanja</h1>` at the top of the page content
- [x] 1.3 In `src/books/book-library.tsx`, remove the icon + h1 heading row and add `<h1 className="sr-only">Knjige</h1>` at the top of the page content

## 2. Update tests

- [x] 2.1 Update Dashboard tests: replace any `getByRole('heading', { name: 'Panel' })` queries to look for the sr-only h1 (use `{ hidden: true }` if needed) or remove assertions on the visual heading
- [x] 2.2 Update Settings tests similarly for "Podešavanja"
- [x] 2.3 Update Book Library tests similarly for "Knjige"
- [x] 2.4 Run full test suite and confirm all tests pass

## 3. Verify

- [x] 3.1 Run `pnpm build` and confirm no TypeScript errors
- [x] 3.2 Visually confirm the three pages no longer show visible headings in the dev server
