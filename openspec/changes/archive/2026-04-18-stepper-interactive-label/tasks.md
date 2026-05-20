## 1. Update StepperLabel

- [x] 1.1 Add optional `onClick` prop to `StepperLabelProps`
- [x] 1.2 Replace `StepperButton` root with HeroUI `Button` directly (`onPress`, `excludeFromTabOrder`, `pointer-events-none` when no `onClick`)

## 2. Remove StepperButton

- [x] 2.1 Delete `src/ui/stepper/stepper-button.tsx`
- [x] 2.2 Remove `Button: StepperButton` from `index.ts` compound object

## 3. Simplify WizardStepper

- [x] 3.1 Remove the conditional `Stepper.Button` wrapper around `Stepper.Label` in `wizard-stepper.tsx`
- [x] 3.2 Pass `onClick` directly to `Stepper.Label` instead

## 4. Layout cleanup

- [x] 4.1 Remove redundant max-width wrapper div around `WizardStepper` in `setup-wizard.tsx`
- [x] 4.2 Remove `max-w-2xl` from `ProfileStep` and `SignatureStep` card elements

## 5. Tests and quality

- [x] 5.1 Remove `Stepper.Button` describe block from `stepper.spec.tsx`; move "step renders as div" to accessibility
- [x] 5.2 Add `StepperLabel` tests: `onClick` fires; no-`onClick` → `tabindex=-1` and `pointer-events-none`
- [x] 5.3 Update `wizard-stepper.spec.tsx` to use name-based button queries
- [x] 5.4 Run `pnpm -s test --reporter=json --changed` — 31/31 pass
- [x] 5.5 Run `pnpm -s lint:fix` — no remaining errors
- [x] 5.6 Run `pnpm -s build` — no type errors
