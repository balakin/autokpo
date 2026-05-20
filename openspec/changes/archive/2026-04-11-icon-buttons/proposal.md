## Why

The current "Add", "Edit", and "Delete" action buttons use text labels ("Dodaj unos", "Uredi", "Obriši"), which take up unnecessary space in card headers and compact table rows. Replacing them with icon-only buttons using `@iconify/react` (already installed) with `gravity-ui:` icons reduces visual clutter and aligns with the icon style already used throughout the app (e.g., `gravity-ui:tray` in the empty state).

## What Changes

- Replace the "Dodaj unos" text button in `WorkingLayout` with an icon-only `gravity-ui:plus` button.
- Replace the "Uredi" text button in `EntityProfilePreview` card header with an icon-only `gravity-ui:pencil` button.
- Replace the "Uredi" text button in `SignaturePreview` card header with an icon-only `gravity-ui:pencil` button.
- Replace the "Uredi" text button in `EntriesTable` rows with an icon-only `gravity-ui:pencil` button.
- Replace the "Obriši" text button in `EntriesTable` rows with an icon-only `gravity-ui:trash-bin` button.
- Wrap each icon-only button in a `Tooltip` for accessibility (hover hints and screen reader support).
- Update tests that query by button text to use accessible `aria-label` instead.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `entry-management`: The Add, Edit, and Delete action triggers change from labeled text buttons to icon-only buttons with tooltips. Tests and scenario language referencing button text ("Dodaj unos", "Uredi", "Obriši") need to reflect the new `aria-label` / `Tooltip` pattern.
- `entity-profile-preview`: The "Uredi" button in the card header becomes an icon-only pencil button with a tooltip. Spec scenario language referencing "Uredi" needs updating.
- `signature-preview`: The "Uredi" button in the card header becomes an icon-only pencil button with a tooltip. Spec scenario language referencing "Uredi" needs updating.

## Impact

- **Files modified**: `src/working-layout/working-layout.tsx`, `src/entries/entries-table.tsx`, `src/entity-profiles/entity-profile-preview.tsx`, `src/signatures/signature-preview.tsx`, plus associated test files
- **No new dependencies** — `@iconify/react` is already installed
- **No API or data changes** — purely a presentation-layer change
- **Accessibility**: `aria-label` and `Tooltip` required on all icon-only buttons to preserve discoverability
