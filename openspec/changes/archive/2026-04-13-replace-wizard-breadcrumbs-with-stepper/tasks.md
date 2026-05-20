## 1. Wizard Context

- [x] 1.1 Create `src/setup-wizard/wizard-context.ts` — define `WizardFormStep` const enum (`Profile = 0`, `Signature = 1`), `WizardContext` with `{ activeStep: WizardFormStep; onBack: () => void }`, and `useWizardContext` hook

## 2. WizardStepper Component

- [x] 2.1 Create `src/setup-wizard/wizard-stepper.tsx` — render `<Stepper activeStep={activeStep}>` with two `Stepper.Step` children; "Profil" step uses `Stepper.Button` (calling `onBack`) only when `activeStep === WizardFormStep.Signature`
- [x] 2.2 Add `Stepper.Label` with correct labels ("Profil", "Potpis") to each step

## 3. Wire Context into SetupWizard

- [x] 3.1 Update `src/setup-wizard/setup-wizard.tsx` — wrap `profile` and `signature` renders with `WizardContext.Provider` supplying correct `activeStep` and `onBack`; remove `onBack` prop from `<SignatureStep>`

## 4. Update Step Components

- [x] 4.1 Update `src/setup-wizard/profile-step.tsx` — replace `<WizardBreadcrumbs step="profile" />` with `<WizardStepper />`
- [x] 4.2 Update `src/setup-wizard/signature-step.tsx` — replace `<WizardBreadcrumbs step="signature" onProfileClick={onBack} />` with `<WizardStepper />`; remove `onBack` prop and its interface field

## 5. Delete WizardBreadcrumbs

- [x] 5.1 Delete `src/setup-wizard/wizard-breadcrumbs.tsx`
- [x] 5.2 Delete `src/setup-wizard/__tests__/wizard-breadcrumbs.spec.tsx`

## 6. Tests

- [x] 6.1 Create `src/setup-wizard/__tests__/wizard-stepper.spec.tsx` — cover: stepper renders on profile step (Profil active, Potpis upcoming), stepper renders on signature step (Potpis active, Profil complete), Profil button present only on signature step, clicking Profil button calls `onBack`

## 7. Spec Update

- [x] 7.1 Archive delta spec into `openspec/specs/setup-wizard/spec.md` — apply MODIFIED and REMOVED requirements from the change spec

## 8. Refactor: props-based WizardStepper, shell in SetupWizard

- [x] 8.1 Refactor `wizard-stepper.tsx` — export `WizardStep` type; accept `{ step, setStep }` props; compute index and `onBack` internally
- [x] 8.2 Delete `wizard-context.ts`
- [x] 8.3 Update `setup-wizard.tsx` — move shell div here; render `<WizardStepper step={step} setStep={setStep}>` + step on form steps; remove context imports
- [x] 8.4 Update `profile-step.tsx` — remove outer div and `WizardStepper`; render Card only
- [x] 8.5 Update `signature-step.tsx` — remove outer div and `WizardStepper`; remove `onBack` prop; render Card only
- [x] 8.6 Update `wizard-stepper.spec.tsx` — replace context wrapper with direct props
- [x] 8.7 Update `profile-step.spec.tsx` and `signature-step.spec.tsx` — remove context wrapper

## 9. Verify

- [x] 9.1 Run `pnpm test` — all tests pass
- [x] 9.2 Run `pnpm build` — no type errors
