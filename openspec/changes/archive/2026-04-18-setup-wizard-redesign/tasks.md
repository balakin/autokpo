## 1. Rename and rewrite StartStep

- [x] 1.1 Rename `src/setup-wizard/welcome-step.tsx` to `start-step.tsx` and rename `WelcomeStep` component to `StartStep`
- [x] 1.2 Rewrite `StartStep` content: heading, list of upcoming steps (Profil, Potpis), and "Sve podatke možete promeniti kasnije u podešavanjima." note
- [x] 1.3 Keep `onNext` prop; remove the standalone card wrapper padding (layout is now owned by `setup-wizard.tsx`)

## 2. Update WizardStepper

- [x] 2.1 Add `'start'` to the `WizardStep` union type (remove `'welcome'`)
- [x] 2.2 Add Početak as step 0 in `WizardStepper` with no `onClick` handler (non-navigable at all times)
- [x] 2.3 Update `activeStep` index: `start` → 0, `profile` → 1, `signature` → 2

## 3. Update SetupWizard layout

- [x] 3.1 Replace the `max-w-3xl` stepper container with a full-width container
- [x] 3.2 Wrap step content in `max-w-2xl mx-auto w-full` instead of per-card constraints
- [x] 3.3 Replace early-return `welcome` branch with `start` branch that renders `<StartStep>`
- [x] 3.4 Update initial step: fresh book (`profile === null`) starts at `'start'`

## 4. Update tests

- [x] 4.1 Update `setup-wizard.spec.tsx`: replace `'welcome'` references with `'start'`, `WelcomeStep` with `StartStep`
- [x] 4.2 Update `wizard-stepper.spec.tsx`: assert three steps, Početak non-clickable in all states
- [x] 4.3 Update `welcome-step.spec.tsx` → rename file to `start-step.spec.tsx`, update component import and assertions for new content
- [x] 4.4 Run full test suite and fix any remaining failures

## 5. Unsaved changes guard

- [x] 5.1 Add `onDirtyChange?: (isDirty: boolean) => void` prop to `EntityProfileForm`; call it via stabilised `useEffect([formState.isDirty])`
- [x] 5.2 Add `onDirtyChange` prop to `SignatureForm` using the same pattern
- [x] 5.3 Thread `onDirtyChange` through `ProfileStep` and `SignatureStep`
- [x] 5.4 Add `isDirty` + `pendingStep` state to `SetupWizard`; intercept stepper navigation via `handleSetStep` when dirty
- [x] 5.5 Add `useBlocker(isDirty)` to block in-app route navigation when dirty
- [x] 5.6 Create `src/setup-wizard/unsaved-changes-dialog.tsx` (`AlertDialog` with "Napustite" / "Ostanite" actions)
- [x] 5.7 Add `handleFormSuccess` that clears `isDirty` before navigating (bypasses dirty guard for successful form submits)
- [x] 5.8 Write tests: `unsaved-changes-dialog.spec.tsx`; extend `setup-wizard.spec.tsx` with dirty-guard scenarios; add `onDirtyChange` tests to both form specs

## 6. Lint and typecheck

- [x] 6.1 Run `pnpm lint:fix` and resolve any remaining errors
- [x] 6.2 Run `pnpm build` and confirm no TypeScript errors
