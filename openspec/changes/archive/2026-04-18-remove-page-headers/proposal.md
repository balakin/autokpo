## Why

The page-level h1 headers on Dashboard, Settings, and Book Library pages are visually redundant — the sidebar navigation already makes the active page clear. Removing them declutters the UI and gives content more vertical space.

## What Changes

- Remove the visible icon + heading row from the top of the Dashboard, Settings, and Book Library pages
- Replace each removed h1 with a visually-hidden `sr-only` heading so screen readers retain a document landmark
- No changes to setup wizard, working-layout card headers, or in-card section headings (h2s inside cards remain)

## Capabilities

### New Capabilities

- `page-header-accessibility`: Screen-reader-only h1 headings on pages where the visual header is removed — ensures document outline and `<main>` landmark are still labelled for assistive technology.

### Modified Capabilities

- `dashboard`: Visual page header removed; sr-only h1 retained.
- `settings`: Visual page header removed; sr-only h1 retained.
- `book-library`: Visual page header removed; sr-only h1 retained.

## Impact

- `src/dashboard/dashboard-page.tsx` — remove icon + h1 block
- `src/settings/settings-page.tsx` — remove icon + h1 block
- `src/books/book-library.tsx` — remove icon + h1 block
- Existing snapshot / RTL tests for these pages may need updating
- No API, routing, or dependency changes
