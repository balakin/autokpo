## Context

After introducing the `@eslint-react` plugin, 18 warnings appeared across 15 files. All warnings are mechanical: they flag deprecated or non-idiomatic React patterns that have cleaner React 19 alternatives. No architectural decisions are required — each warning has a well-defined fix.

## Goals / Non-Goals

**Goals:**

- Zero `@eslint-react` warnings in the codebase
- Use React 19 idioms (`use`, `<Context>` as provider) where the plugin recommends them
- Fix purity violations (`new Date()` during render)

**Non-Goals:**

- Changing ESLint configuration or rule severity
- Refactoring beyond what removes the warning

## Decisions

**Fix `@eslint-react/no-use-context` (10 occurrences)**: Replace `useContext(Ctx)` with `use(Ctx)` in every affected file. The React 19 `use` hook is a drop-in replacement for `useContext` and is preferred by the rule. Files: `top-bar-actions.tsx`, `use-top-bar-portal-ref.ts`, `use-books.ts`, `use-doc.ts`, `use-entity-profile.ts`, `use-entries.ts`, `use-locale.ts`, `use-theme.ts`, `use-signature.ts`, `stepper-context.ts`.

**Fix `@eslint-react/no-context-provider` (1 occurrence)**: In `books-provider.tsx`, replace `<BooksContext.Provider value={...}>` with `<BooksContext value={...}>`. React 19 allows rendering the context object itself as a provider.

**Fix `@eslint-react/purity` (2 occurrences)**:

- `add-book-modal.tsx` line 34: Move `new Date()` out of render into a `useState` initializer or `useMemo`.
- `use-stats.ts` line 10: Same — move `new Date()` into a stable reference (state initializer or `useMemo`).

**Fix `@eslint-react/no-array-index-key` (2 occurrences)**:

- `top-bar.tsx` line 57: The items being mapped need stable keys. If they have a natural identifier, use it. If not, use a string key derived from content.
- `stepper-root.tsx` line 36: Same approach.

**Fix `@eslint-react/use-state` (1 occurrence)**: In `theme-provider.tsx` line 31, rename the setter to follow the `setX` naming convention (e.g., `setTheme` if the state variable is `theme`).

**Fix `@eslint-react/no-children-to-array` (1 occurrence)**: In `stepper-root.tsx` line 23, replace `Children.toArray(children)` with `React.Children.toArray` ... actually the rule flags `Children.toArray` itself as legacy. Use `React.Children.map` or restructure to accept an explicit array prop instead.

## Risks / Trade-offs

- `use(Ctx)` vs `useContext(Ctx)`: Both are functionally identical for synchronous context reads; no runtime risk.
- Moving `new Date()` to state initializer: Slightly different semantics — the date is captured at mount rather than each render, which is the correct behavior for a "today" reference.
- Removing `Children.toArray`: The stepper currently uses `Children.toArray` to assign keys. Switching to an explicit children prop or `React.Children.map` is the idiomatic alternative; visually identical.
