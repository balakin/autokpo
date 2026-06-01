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

## Open Questions

- Should the book entry count remain visible on wide desktop cards, or should it be removed consistently from all library cards? The proposal currently favors removing it from the visible card entirely.
- Should safe-area utilities be named generically for any future full-screen overlay, or specifically for Drawer usage?
