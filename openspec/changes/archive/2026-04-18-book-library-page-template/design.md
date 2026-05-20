## Context

`BookLibrary` is the only page that deviates from the app-wide page template. It uses a centered, max-width-constrained container (`max-w-3xl items-center`), a `text-2xl` heading without an icon, and a gap of `gap-4`. All other pages (Dashboard, Settings, WorkingLayout) use a full-width flex column with `gap-6` spacing, `p-4 lg:p-6` padding, and a heading composed of a Lucide icon + `text-xl font-semibold` label.

## Goals / Non-Goals

**Goals:**

- Align `BookLibrary` layout, heading, and spacing with the established page template.
- Add an icon to the page heading (`LuBook`).
- Standardize spacing from `gap-4` to `gap-6` at the page level.
- Remove the custom centered max-width wrapper (full-width, like other pages).

**Non-Goals:**

- Moving the "Nova knjiga" button to the TopBar — it stays co-located with the list heading.
- Changing routing, data fetching, or business logic.
- Redesigning individual `BookRow` cards.

## Decisions

**Full-width layout over centered container**
Other pages do not constrain content width. Removing `items-center` and `max-w-3xl` makes the page consistent and lets the AppShell's own padding handle whitespace on large screens.

**Move "Nova knjiga" button to TopBar via `TopBarActionsSlot`**
Keeping the button in the heading row made the heading taller than on other pages. WorkingLayout already uses `TopBarActionsSlot` for contextual actions. Placing the add-book button there keeps the heading row to icon + label only, matching Dashboard and Settings exactly.

**Icon choice: `LuBook`**
Already imported in other book-related components and matches the sidebar nav icon for Knjige.

## Risks / Trade-offs

- [Visual regression in tests] → Snapshot tests (if any) will need updating. RTL behavior tests are unaffected.
- [Wider content on large monitors] → Acceptable; other pages already render full-width.
