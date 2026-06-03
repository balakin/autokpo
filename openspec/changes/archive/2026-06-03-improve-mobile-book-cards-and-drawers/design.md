## Context

The `/books` library card currently puts year/status tags on the left and total income plus entry count on the right. On narrow screens, duplicated/incomplete tags can compete with the entry-count label and reduce scanability.

The app also uses several full-screen mobile Drawer patterns: the signed-in sidebar drawer, the signed-in profile drawer, the auth preferences drawer, and the encryption profile/preferences drawer. These surfaces visually fill the viewport, but the app has no explicit safe-area CSS and the viewport meta does not opt into edge-to-edge painting. On iOS Safari and standalone PWA contexts, the browser can expose unsafe/dead-zone areas whose color comes from page/theme chrome rather than the currently open drawer surface.

Relevant constraints:

- HeroUI v3 Drawer/Popover compound components remain the overlay primitives.
- Tailwind v4 utility classes and CSS tokens are the styling system.
- Desktop popovers and desktop sidebar behavior should not change.
- Entry counts remain available in destructive copy where they help users understand delete impact.

## Goals / Non-Goals

**Goals:**

- Reduce book library card density on phones by removing the visible list-row entry-count label.
- Keep income, year, duplicate/incomplete status tags, favorite toggle, open, and delete actions visible.
- Enable iOS safe-area ownership for full-screen mobile drawers so the drawer background fills unsafe regions.
- Apply one consistent safe-area pattern across mobile sidebar/account/preferences drawers.
- Keep desktop layout, route behavior, and app data unchanged.

**Non-Goals:**

- Redesign the whole book library card or change sorting/filtering behavior.
- Remove entry-count information from confirmations or domain data.
- Introduce a new drawer library, custom overlay framework, or runtime device detection.
- Dynamically recolor `theme-color` per open drawer state as the primary fix.
- Change sync, authentication, worker APIs, or persisted data.

## Decisions

### Remove the entry-count label from book list cards

The card should stop rendering the visible `Plural` entry-count label in the book row header. The delete confirmation should keep using the entry count because that is where the count directly affects user confidence before a destructive action.

Alternatives considered:

- Hide the count only below a breakpoint: preserves desktop density, but creates two variants for a low-value label.
- Move the count into a secondary meta row: avoids collision but makes mobile cards taller and noisier.
- Keep the current layout and tune gaps/wrapping: still leaves competing metadata in the most crowded row.

### Treat safe-area support as a shared overlay surface concern

Global CSS should define reusable safe-area-aware helpers or utilities for full-screen mobile drawer surfaces and their inner content. Drawer surfaces should extend their own background through unsafe areas; internal content should receive padding based on `env(safe-area-inset-*)` combined with normal spacing using `max()` or equivalent CSS.

Alternatives considered:

- Per-component ad hoc padding: fast, but easy for future mobile drawers to diverge.
- Only change `html/body` background: reduces mismatch in some cases but cannot match both sidebar and account drawer surfaces simultaneously.
- Only update `theme-color`: affects browser chrome but does not guarantee fixed overlay safe-area painting.

### Opt into viewport safe-area painting deliberately

The viewport meta should include `viewport-fit=cover` so Safari allows the app to paint into the safe area. This must be paired with safe-area padding on drawer contents to avoid placing controls under the notch, dynamic island, or home indicator.

Alternatives considered:

- Avoid `viewport-fit=cover`: keeps Safari automatic insetting, but can leave the unwanted dead-zone color outside full-screen overlays.
- Use hard-coded device padding: brittle across devices and orientation.

### Keep `theme-color` as supporting polish, not the main fix

The existing light/dark theme-color initialization can remain responsible for browser chrome. The drawer bug should be solved by surface/background ownership rather than changing theme-color when overlays open.

Alternatives considered:

- Change theme-color to sidebar/background per drawer open state: complex, fragile with multiple drawers, and easy to desynchronize across theme changes.

## Risks / Trade-offs

- `viewport-fit=cover` without correct padding can move controls too close to unsafe screen edges → mitigate by applying safe-area padding to drawer header/body/footer content.
- Safe-area CSS is difficult to assert in JSDOM → mitigate with structure/class tests plus manual verification on iOS Safari or iOS Simulator.
- Removing the entry-count label reduces at-a-glance detail → mitigate by preserving count in delete confirmation and keeping income as the more important list metric.
- Multiple drawer implementations can drift → mitigate by centralizing the safe-area class names or wrapper pattern and applying it to every mobile full-screen drawer in this change.

## Migration Plan

1. Update the book library card markup and tests to remove visible list-row entry-count expectations.
2. Add viewport safe-area support and reusable CSS utilities/classes.
3. Apply the safe-area surface/content pattern to each full-screen mobile drawer.
4. Update existing drawer/popover tests to cover the expected safe-area structure where practical.
5. Validate on narrow mobile viewport and, if possible, iOS Safari/standalone PWA mode.

Rollback is straightforward: revert the UI markup/CSS/meta changes. No persisted data or API migrations are involved.

### Remove dedicated sidebar color tokens

The custom `--sidebar-*` CSS variables and their `@theme inline` registrations were removed. Sidebar surfaces, text, and borders now use the same standard design tokens (`bg-background`, `text-foreground`, `text-muted`, `border-border`) as the rest of the app. The active nav item uses `bg-accent`/`text-accent-foreground`.

Alternatives considered:

- Keep separate tokens for a distinct sidebar palette: adds per-token maintenance burden and the visual contrast was not required by design.

### Fix app-shell layout for mobile scroll

The desktop `h-screen overflow-hidden` pattern prevents page-level scrolling; on mobile this caused content to be clipped. The fix scopes `lg:h-dvh lg:overflow-hidden` to the desktop breakpoint and makes the main content area scroll naturally on mobile. The top bar is pinned with `fixed inset-x-0 top-0` on mobile and `lg:static` on desktop so it stays visible during scroll. The main content adds `pt-14` on mobile to compensate.

Alternatives considered:

- Scroll inside the `<main>` on all widths: keeps the constraint but the fixed-top-bar pattern is simpler to reason about on mobile.

### Use CSS keyframe slide animations for all drawers

HeroUI v3's default drawer transitions are opacity-based and look weak on mobile. All drawers now use enter/exit keyframe animations that slide the panel in from and out to its placement edge. The implementation hooks into React Aria's `getAnimations()` exit-gate pattern (`_drawer-exit-gate` on backdrop and content) so the component waits for the animation before unmounting. Reduced-motion disables these with `animation: none !important`.

### Cap dashboard stat grid at two columns

The `lg:grid-cols-4` stat-card grid is too dense on tablets (768–1024 px). Capping at `sm:grid-cols-2` makes each card readable at any common phone or tablet width without losing information.

### Replace custom Settings tab navigation with HeroUI Tabs

The previous pill-style tab nav was built from `<Link>` elements styled with `tailwind-variants`. HeroUI `Tabs` handles keyboard navigation, `aria-selected`, and route-based `selectedKey` out of the box, reducing bespoke code. The component wraps the same React Router `href` links inside `Tabs.Tab`.

### Remove draft warning Alert from working layout

The Alert warned that downloaded PDFs are drafts. This was redundant with the document itself and added noise to every book page visit. It was removed; the regulation note belongs in documentation or the download flow, not as a persistent page banner.

### Refactor AuthShell/EncryptionShell background to use grid-background utility

Both shells had inline Tailwind arbitrary-value classes for the grid pattern (`bg-[linear-gradient(...)]`). These were extracted to a `@utility grid-background` class in `index.css`, removing duplication and enabling IDE completion. The decorative radial gradient blobs were moved to absolutely-positioned siblings flanking the form card rather than covering the full viewport.

### Make entity profile and signature preview grids responsive

Both detail grids were fixed-column (`grid-cols-3` and `grid-cols-2`). On narrow screens labels and values collided. Changed to single-column on mobile with breakpoint expansion (`sm:grid-cols-2`, `lg:grid-cols-3`).

## Open Questions

- (Resolved) The book entry count is removed from all library cards, not just narrow viewports.
- (Resolved) The `grid-background` utility is named generically and can be reused by any shell-level layout.
