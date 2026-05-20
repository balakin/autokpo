## Why

The app has a setup wizard (`src/setup-wizard/`) that uses custom breadcrumbs for step navigation. A reusable Stepper component in `src/ui/stepper/` would provide a proper step-by-step navigation primitive, aligned with HeroUI v3's compound component and design patterns. This enables consistent multi-step flows across the app.

## What Changes

- Add a new `Stepper` compound component at `src/ui/stepper/` following HeroUI v3 composition conventions (e.g., `Stepper.Step`, `Stepper.Label`).
- The component is headless-friendly: manages step state, supports controlled mode via `activeStep` prop, horizontal/vertical orientation, and step status (complete, active, upcoming).
- Uses HeroUI v3 design tokens (colors, spacing, radii) and Tailwind v4 for styling.
- Indicator transitions (number → check icon) are animated using `react-transition-group`.
- Requires existing project dependencies: `react-transition-group` for animations.

## Capabilities

### New Capabilities

- `stepper`: A reusable compound Stepper UI component with step indicators, navigation, and state management. Supports controlled/uncontrolled usage, orientation variants, and accessibility.

### Modified Capabilities

_(none)_

## Impact

- New directory: `src/ui/stepper/`
- New dependency: `react-transition-group` (for indicator transition animations)
- No changes to existing code — this is an additive component.
- Future: the setup wizard could adopt this component, but that is out of scope for this change.
