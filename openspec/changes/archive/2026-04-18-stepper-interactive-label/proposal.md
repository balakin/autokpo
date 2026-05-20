## Why

When the setup wizard transitions from the profile step to the signature step, the first `Stepper.Label` conditionally switches from being a plain label to being wrapped inside a `Stepper.Button`. This structural change causes React to remount the `StepperLabel` component, destroying the in-flight `SwitchTransition` animation that swaps the step number for a check icon.

## What Changes

- **BREAKING** `Stepper.Button` is removed. It was a redundant wrapper; its functionality is now built directly into `Stepper.Label`.
- `Stepper.Label` gains an optional `onClick` prop. When provided, the label becomes interactive (focusable, keyboard-activatable); when absent, it renders as a visually identical but non-interactive element (excluded from tab order, no pointer events). The DOM element type is always a `<button>`, so the component never remounts when interactivity changes.
- `WizardStepper` is simplified: no longer conditionally wraps `Stepper.Label` inside `Stepper.Button`; passes `onClick` directly to `Stepper.Label` instead.
- Minor layout cleanup in `SetupWizard`, `ProfileStep`, and `SignatureStep` (width constraints consolidated to parent container).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `stepper`: `Stepper.Label` now accepts an `onClick` prop for inline interactivity. `Stepper.Button` is removed from the public API.

## Impact

- `src/ui/stepper/stepper-label.tsx` — adds `onClick` prop; renders HeroUI `Button` directly
- `src/ui/stepper/stepper-button.tsx` — **deleted**
- `src/ui/stepper/index.ts` — `Button` removed from `Stepper` compound object
- `src/setup-wizard/wizard-stepper.tsx` — removes conditional `Stepper.Button` wrapper
- `src/setup-wizard/setup-wizard.tsx`, `profile-step.tsx`, `signature-step.tsx` — layout tweaks
- Existing `stepper` spec delta needed: `Stepper.Label` updated, `Stepper.Button` removed
