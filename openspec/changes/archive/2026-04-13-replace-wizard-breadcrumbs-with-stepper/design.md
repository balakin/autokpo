## Context

`SetupWizard` manages step state (`welcome | profile | signature`) and passes navigation callbacks down to `ProfileStep` (`onNext`) and `SignatureStep` (`onBack`). Each form step renders `WizardBreadcrumbs` directly, which must receive `step` and `onBack` as props. This threads navigation state through every step component even though only `WizardStepper` needs it.

The codebase already has a `Stepper` component (`src/ui/stepper/`) with the exact API needed: `activeStep`, labeled steps, and clickable steps via `Stepper.Button`.

## Goals / Non-Goals

**Goals:**

- Replace `WizardBreadcrumbs` with `WizardStepper` rendered by `SetupWizard`
- `SetupWizard` owns the page shell (root div) and renders `WizardStepper` directly alongside step content
- Step components (`ProfileStep`, `SignatureStep`) render only their Card — no outer div, no stepper
- Keep `SetupWizard` as the single owner of step state and navigation

**Non-Goals:**

- Changing wizard step logic or transitions
- Changing form components (`EntityProfileForm`, `SignatureForm`)

## Decisions

### 1. `WizardStepper` receives `step` + `setStep`; computes index and back-navigation internally

`WizardStepper` accepts `{ step: WizardStep; setStep: (step: WizardStep) => void }`. It derives `activeStep` (index) and the `onBack` handler from those two values — no caller needs to pre-compute anything. `WizardStep` is a plain string union exported from `wizard-stepper.tsx` and re-used by `SetupWizard`:

```ts
export type WizardStep = 'welcome' | 'profile' | 'signature';
```

Inside `WizardStepper`:

- `activeStep` = `step === 'profile' ? 0 : 1`
- `onBack = () => setStep('profile')` — only wired to a `Stepper.Button` when `step === 'signature'`

No named constants needed — the string literals are self-documenting and the type keeps call sites type-safe.

Alternative considered: `as const` object for named members. Rejected — unnecessary indirection for a three-value domain that never changes at runtime.

### 2. `SetupWizard` owns the page shell and WizardStepper

The `min-h-screen` wrapper div moves from step components into `SetupWizard`. On form steps, `SetupWizard` renders:

```tsx
<div className="...">
  <WizardStepper step={step} setStep={setStep} />
  <ProfileStep onNext={...} />   {/* or SignatureStep */}
</div>
```

The welcome step keeps its own full-screen layout (no stepper).

### 3. Step components render Card only

`ProfileStep` and `SignatureStep` drop their outer `div` wrapper and `WizardStepper` import. They render only the `Card` block. This makes them pure content components, easier to test and reuse.

### 4. `SignatureStep` drops `onBack` prop

`SetupWizard` passes `setStep` to `WizardStepper`, not to `SignatureStep`. `SignatureStep` no longer needs any navigation prop.

## Risks / Trade-offs

- **Test surface shifts** — `wizard-breadcrumbs.spec.tsx` deleted; `wizard-stepper.spec.tsx` covers the equivalent scenarios. Step tests no longer need context or nav-prop setup.
- **Shell layout in SetupWizard** — welcome step retains its own layout; form steps share the shell from `SetupWizard`. `WelcomeStep` is the only outlier and it has no stepper.

## Migration Plan

1. Refactor `wizard-stepper.tsx` — export `WizardStep` type; accept `{ step, setStep }` props; compute index and `onBack` internally
2. Delete `wizard-context.ts`
3. Update `setup-wizard.tsx` — import `WizardStep` from `wizard-stepper`; move shell div here; render `<WizardStepper step={step} setStep={setStep}>` + step content on form steps; remove context wrappers
4. Update `profile-step.tsx` — remove outer div and `WizardStepper`; render Card only
5. Update `signature-step.tsx` — remove outer div and `WizardStepper`; remove `onBack` prop; render Card only
6. Update `wizard-stepper.spec.tsx` — test via `step`/`setStep` props directly
7. Update `profile-step.spec.tsx` and `signature-step.spec.tsx` — remove context wrapper
8. Run tests + build
