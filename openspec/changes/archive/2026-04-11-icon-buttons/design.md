## Context

The app already uses `@iconify/react` with the `gravity-ui:` prefix (e.g., `gravity-ui:tray` in the empty state). Five text-label buttons across four components need to become icon-only:

| Component                | Button       | Replacement icon       |
| ------------------------ | ------------ | ---------------------- |
| `WorkingLayout`          | "Dodaj unos" | `gravity-ui:plus`      |
| `EntityProfilePreview`   | "Uredi"      | `gravity-ui:pencil`    |
| `SignaturePreview`       | "Uredi"      | `gravity-ui:pencil`    |
| `EntriesTable` (per row) | "Uredi"      | `gravity-ui:pencil`    |
| `EntriesTable` (per row) | "Obriši"     | `gravity-ui:trash-bin` |

HeroUI v3 `Button` supports `isIconOnly` and `Tooltip` is available in the same package.

## Goals / Non-Goals

**Goals:**

- Replace all five text buttons with icon-only buttons using existing `@iconify/react` + `gravity-ui:` icons
- Preserve existing button variants and sizes (secondary / danger-soft / primary; sm in table rows)
- Add `Tooltip` and `aria-label` on every icon button for accessibility
- Update tests to query by `aria-label` instead of button text

**Non-Goals:**

- Changing button functionality, modal behavior, or any business logic
- Installing `@gravity-ui/icons` as a separate package
- Changing button variants or sizes

## Decisions

### Use `@iconify/react` `<Icon>` component, not `@gravity-ui/icons`

`@iconify/react` is already installed and the `gravity-ui:` icon prefix is already in use in the codebase. Adding `@gravity-ui/icons` as a separate direct dependency is unnecessary.

### Icon names: `gravity-ui:plus`, `gravity-ui:pencil`, `gravity-ui:trash-bin`

These match the kebab-case Iconify naming convention for the gravity-ui icon set. The `gravity-ui:tray` icon already in the codebase confirms this pattern works.

### Wrap each icon button in `Tooltip`

HeroUI v3's `Tooltip` component is the idiomatic hover-hint for icon-only buttons in this stack. Each button also gets a matching `aria-label` so screen readers announce the action.

### Keep existing button variants

| Action             | Variant             |
| ------------------ | ------------------- |
| Add ("Dodaj unos") | `primary` (default) |
| Edit ("Uredi")     | `secondary`         |
| Delete ("Obriši")  | `danger-soft`       |

No visual variant changes — only the label is replaced with an icon.

## Risks / Trade-offs

- **Icon name mismatch** → verify each `gravity-ui:*` name renders in the browser before calling done; Iconify API resolves on demand so a missing icon silently renders nothing.
- **Tooltip accessibility on mobile** → Tooltip hover hints don't appear on touch devices; `aria-label` covers the screen-reader case, but sighted touch users won't see the hint. Acceptable trade-off given the app's primary desktop usage.
