## Why

The previous "Fiscal Modernism" design used a warm cream content area and a constant-dark sidebar that felt disconnected in light mode. The new arctic palette introduces a cohesive blue-gray tone system with proper light/dark symmetry, clearer surface layering, and a more professional editorial feel suited to a financial ledger app.

## What Changes

- Replace the warm cream / navy color system with a soft arctic blue-gray palette for both light and dark modes
- Make the sidebar context-aware: light-colored in light mode, dark in dark mode (previously always dark)
- Expand CSS custom property system with full semantic tokens: `--overlay`, `--field-*`, `--segment`, shadow variables, and `--accent-soft`
- Replace hand-rolled version badge `<span>` in the sidebar with HeroUI `<Chip>` component
- Remove unnecessary `<Surface>` wrapper inside `EntryModal` body
- Update top-bar hamburger button variant from `tertiary` to `ghost`
- Update page title from `kpo` to `KPO` and sidebar logo from `КПО` to `KPO`

## Capabilities

### New Capabilities

- `design-tokens`: CSS custom property token system defining the app's full color and shadow palette across light and dark themes

### Modified Capabilities

- `app-shell`: Sidebar appearance changes — sidebar is no longer constant-dark; it adapts to the active theme (light sidebar in light mode, dark in dark mode). Version badge uses HeroUI Chip instead of a plain span.

## Impact

- `src/index.css` — complete token system rewrite
- `src/app-shell/sidebar.tsx` — Chip component, logo text
- `src/app-shell/top-bar.tsx` — button variant
- `src/app-shell/mobile-drawer.tsx` — removed hardcoded sidebar-fg class
- `src/entries/entry-modal.tsx` — removed Surface wrapper
- `index.html` — title casing, body text-foreground class
