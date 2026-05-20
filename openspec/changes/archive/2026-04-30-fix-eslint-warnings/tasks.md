## 1. Fix `no-use-context` warnings (replace useContext with use)

- [x] 1.1 Update `src/app-shell/top-bar-actions.tsx` — replace `useContext` with `use`
- [x] 1.2 Update `src/app-shell/use-top-bar-portal-ref.ts` — replace `useContext` with `use`
- [x] 1.3 Update `src/books/use-books.ts` — replace `useContext` with `use`
- [x] 1.4 Update `src/crdt/use-doc.ts` — replace `useContext` with `use`
- [x] 1.5 Update `src/entity-profiles/use-entity-profile.ts` — replace `useContext` with `use`
- [x] 1.6 Update `src/entries/use-entries.ts` — replace `useContext` with `use`
- [x] 1.7 Update `src/i18n/use-locale.ts` — replace `useContext` with `use`
- [x] 1.8 Update `src/settings/use-theme.ts` — replace `useContext` with `use`
- [x] 1.9 Update `src/signatures/use-signature.ts` — replace `useContext` with `use`
- [x] 1.10 Update `src/ui/stepper/stepper-context.ts` — replace all 3 `useContext` calls with `use`

## 2. Fix `no-context-provider` warning

- [x] 2.1 Update `src/books/books-provider.tsx` — replace `<BooksContext.Provider>` with `<BooksContext>`

## 3. Fix purity warnings (new Date() during render)

- [x] 3.1 Update `src/books/add-book-modal.tsx` — move `new Date()` into a `useState` initializer or `useMemo`
- [x] 3.2 Update `src/stats/use-stats.ts` — move `new Date()` into a `useMemo` or state initializer

## 4. Fix array-index key warnings

- [x] 4.1 Update `src/app-shell/top-bar.tsx` — replace array index key with a stable content-derived key
- [x] 4.2 Update `src/ui/stepper/stepper-root.tsx` — replace array index key with a stable key

## 5. Fix remaining warnings

- [x] 5.1 Update `src/settings/theme-provider.tsx` — rename state setter to follow `setX` convention
- [x] 5.2 Update `src/ui/stepper/stepper-root.tsx` — replace `Children.toArray` with `React.Children.map` or explicit array prop

## 6. Verify

- [x] 6.1 Run `pnpm eslint apps/app` and confirm zero errors and zero warnings
- [x] 6.2 Run `cd apps/app && pnpm -s test --reporter=json | jq '{passed:.numPassedTests,failed:.numFailedTests}'` and confirm all tests pass
