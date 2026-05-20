## Why

The `BookLibrary` page uses a non-standard layout: centered max-width container, `text-2xl` heading without an icon, and inconsistent padding/gap sizes. Every other page in the app (Dashboard, Settings, WorkingLayout) follows a unified template with an icon + label heading, `gap-6` spacing, and full-width layout.

## What Changes

- Replace the custom centered layout in `BookLibrary` with the app-wide page template (full-width, `gap-6`, `p-4 lg:p-6`).
- Update the page heading to use the Icon + Label pattern (`LuBook` icon, `text-xl font-semibold` label) consistent with other pages.
- Move the "Nova knjiga" button to the AppShell TopBar via `TopBarActionsSlot`, matching the pattern used by WorkingLayout.
- Adjust card list gap to `gap-4` to match dense list patterns used elsewhere.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `book-library`: Layout and heading style requirements updated to match app-wide page template (Icon + Label heading, full-width layout, standardized spacing).

## Impact

- `src/books/book-library.tsx` — layout and heading restructured.
- `openspec/specs/book-library/spec.md` — updated to reflect new layout requirements.
- No API, routing, or data changes.
