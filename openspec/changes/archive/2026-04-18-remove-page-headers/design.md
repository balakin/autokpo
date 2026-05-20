## Context

Three main pages — Dashboard, Settings, and Book Library — each render a visible `h1` heading (icon + text) at the top. The sidebar already shows the active page via highlighted nav item, making the visual heading redundant. Removing them improves density without losing information.

The accessibility concern is real: removing a visible `h1` breaks the document outline and removes the implicit label for the `<main>` landmark, which screen readers announce when the user lands on a page.

## Goals / Non-Goals

**Goals:**

- Remove icon + text heading rows from Dashboard, Settings, and Book Library pages
- Preserve a semantically correct `h1` for each page using Tailwind's `sr-only` utility
- Keep setup wizard, card section headings (h2s inside cards), and working-layout headings unchanged

**Non-Goals:**

- Redesigning the sidebar or adding breadcrumbs
- Changing heading levels of in-card section headings
- Any functional changes to page content

## Decisions

### sr-only h1 instead of aria-label on main

**Decision**: Retain the `<h1>` element with `className="sr-only"` text-only (no icon).

**Why**: An `aria-label` on `<main>` would also work, but a real `h1` in the DOM is more robust — it gives screen readers a document outline, headings navigation (`H` key in NVDA/JAWS), and a page title announcement on route change. The `sr-only` class (Tailwind built-in) visually hides without removing from the accessibility tree.

**Alternative considered**: `aria-labelledby` pointing to a visually-hidden span — equivalent but adds an extra element and an id coupling. `<h1 className="sr-only">` is simpler.

### No shared component

**Decision**: Inline `<h1 className="sr-only">` in each page rather than extracting a `<PageTitle>` component.

**Why**: There are only three sites, the pattern is trivial, and a wrapper component would be premature abstraction per project conventions. If more pages adopt this in future, extraction is easy.

## Risks / Trade-offs

- [Risk] Tests that assert the visible heading text will fail → Mitigation: Update RTL queries to use `getByRole('heading', { hidden: true })` or assert on the `sr-only` h1.
- [Risk] Future developer forgets to add sr-only h1 when creating a new page → Mitigation: Document the pattern in the new `page-header-accessibility` spec.
