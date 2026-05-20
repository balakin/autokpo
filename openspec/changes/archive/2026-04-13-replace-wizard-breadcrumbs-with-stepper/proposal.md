## Why

`WizardBreadcrumbs` uses HeroUI `Breadcrumbs` to show wizard progress and must receive navigation state as props that are threaded through `ProfileStep` and `SignatureStep`. The app already ships a purpose-built `Stepper` component for exactly this use case. Replacing breadcrumbs with a context-aware `WizardStepper` removes prop-threading, eliminates the HeroUI `Breadcrumbs` dependency from the wizard, and makes the navigation pattern consistent with the existing UI primitive.

## What Changes

- Add `WizardContext` that provides `activeStep` (0 = profile, 1 = signature) and `onBack` to all form steps
- `SetupWizard` provides the context; only form steps (`profile`, `signature`) are wrapped — not `welcome`
- Add `WizardStepper` component that reads from `WizardContext` and renders `<Stepper>` with two labeled steps; the "Profil" step is clickable (calls `onBack`) when on the signature step
- `SignatureStep` drops its `onBack` prop (now read from context by `WizardStepper`)
- Delete `WizardBreadcrumbs` and its test; add tests for `WizardStepper`
- Update the `setup-wizard` spec: breadcrumb requirements become stepper requirements

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `setup-wizard`: Breadcrumb navigation requirements replaced by stepper navigation requirements. Behavioral contract preserved — two labeled steps ("Profil" / "Potpis"), active step highlighted, back-navigation from signature step. Props and component internals change; user-visible behavior does not.

## Impact

- **Deleted files**: `src/setup-wizard/wizard-breadcrumbs.tsx`, `src/setup-wizard/__tests__/wizard-breadcrumbs.spec.tsx`
- **New files**: `src/setup-wizard/wizard-context.ts`, `src/setup-wizard/wizard-stepper.tsx`, `src/setup-wizard/__tests__/wizard-stepper.spec.tsx`
- **Modified files**: `src/setup-wizard/setup-wizard.tsx`, `src/setup-wizard/profile-step.tsx`, `src/setup-wizard/signature-step.tsx`
- **Updated spec**: `openspec/specs/setup-wizard/spec.md`
- **No new dependencies** — `Stepper` is already in the codebase
