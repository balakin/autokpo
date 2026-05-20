## Context

`StepperLabel` animates its indicator between a step number and a check icon using `react-transition-group`'s `SwitchTransition`. For this animation to run, the `StepperLabel` component must remain mounted across the transition — it must not be remounted.

In the original `WizardStepper`, the first step was conditionally rendered as either `<Stepper.Label>` or `<Stepper.Button><Stepper.Label>`. When the wizard moved from the profile step to the signature step, this conditional switched, changing the parent of `StepperLabel` in the React tree. React treats this as a remount, which discards the running `SwitchTransition` and causes the animation to snap instead of play.

## Goals / Non-Goals

**Goals:**

- Prevent `StepperLabel` remounts when interactivity is toggled
- Keep a single consistent button-shaped root for `StepperLabel` regardless of `onClick` presence
- Preserve tab-order and pointer semantics: non-interactive labels are excluded from focus and click
- Simplify the public API by removing the redundant `Stepper.Button` component

**Non-Goals:**

- Redesigning the broader stepper compound component API
- Adding new animation effects or changing existing CSS transitions

## Decisions

### Decision: `StepperLabel` renders a HeroUI `Button` directly; `Stepper.Button` is removed

`StepperLabel` adopts HeroUI `Button` as its root unconditionally. The `onClick` prop flows through via `onPress`; when absent, the button applies `pointer-events-none` and `excludeFromTabOrder`. `Stepper.Button` is deleted — it was only ever needed because `StepperLabel` used to be a plain `<div>`.

**Alternative considered**: Keep `Stepper.Button` as a thin wrapper, make `StepperLabel` use it internally. Rejected: still two files, the wrapping logic was trivial, and `Stepper.Button` had no use case remaining after `StepperLabel` became the primary interactive surface.

**Alternative considered**: Keep `StepperLabel` as a `<div>` and fix the animation at the consumer level (e.g., force a stable key on `WizardStepper`). Rejected because it pushes an internal concern onto consumers and doesn't prevent the same mistake elsewhere.

## Risks / Trade-offs

- **Semantic mismatch**: A `<button>` with `pointer-events-none` is still in the accessibility tree but not reachable by keyboard. → Mitigation: `excludeFromTabOrder` removes it from the tab sequence; for now this is acceptable given the stepper is decorative when non-interactive.
- **Breaking change**: `Stepper.Button` is removed from the public API. Any consumer using `<Stepper.Button>` must migrate to `<Stepper.Label onClick={...}>`.
