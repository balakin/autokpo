## Why

The mobile drawer currently renders at a fixed width (`w-60 max-w-[80vw]`), which leaves dead space on small screens and makes it harder to tap navigation items. There is also no close button inside the drawer, forcing users to tap the backdrop — an interaction pattern that is not discoverable and fails on some assistive technologies.

## What Changes

- The mobile drawer SHALL take up the full screen height and width on mobile viewports (replacing the partial-width slide-in).
- A close button (×) SHALL be rendered inside the drawer so users can dismiss it without tapping outside.

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `app-shell`: The mobile drawer requirement changes — the drawer SHALL be full-screen on mobile and SHALL include a visible close button.

## Impact

- `src/app-shell/mobile-drawer.tsx` — updated drawer sizing and close button added.
- `openspec/specs/app-shell/spec.md` — delta spec for the updated drawer behaviour.
- Existing tests for `MobileDrawer` / `AppShell` may need updating.
