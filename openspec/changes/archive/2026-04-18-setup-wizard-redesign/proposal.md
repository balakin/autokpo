## Why

The app-shell navigation was significantly redesigned, making the current setup wizard layout feel inconsistent: the stepper is width-constrained when it should span the full content area, and the welcome step sits outside the stepper flow entirely instead of being step 0. The welcome step also no longer explains the required book-creation steps clearly enough.

## What Changes

- Stepper in `setup-wizard.tsx` is made full-width (remove `max-w-3xl` container constraint on the stepper row)
- Step content cards are constrained to `max-w-2xl` and centered horizontally
- Welcome step is renamed to **Početak** (Start) and integrated into the stepper as step 0 (three-step flow: Početak → Profil → Potpis)
- Početak step content is redesigned to introduce the wizard flow — listing the upcoming steps the user must complete before they can use the book
- `WizardStepper` is updated to include the Početak step and reflect three steps

## Capabilities

### New Capabilities

_(none — this is a layout/UX refinement only)_

### Modified Capabilities

- `setup-wizard`: Welcome step renamed to Početak and becomes step 0 inside the stepper; stepper is full-width; step content is max-w-2xl centered; Početak content explains book-creation steps.
- `setup-wizard` (unsaved changes guard): navigating away from the profile or signature step with unsaved form changes is blocked by a confirmation dialog; applies to both stepper-click navigation and in-app route changes via `useBlocker`.

## Impact

- `src/setup-wizard/setup-wizard.tsx` — layout restructure, welcome step moved into stepper flow; unsaved-changes guard via `useBlocker` + `isDirty` state
- `src/setup-wizard/wizard-stepper.tsx` — add Početak step (3 steps total), adjust active-step index
- `src/setup-wizard/welcome-step.tsx` → renamed to `start-step.tsx` — new content explaining upcoming steps; rendered inside stepper layout (not standalone)
- `src/setup-wizard/unsaved-changes-dialog.tsx` — new `UnsavedChangesDialog` component (AlertDialog with confirm/cancel)
- `src/entity-profiles/entity-profile-form.tsx` — new `onDirtyChange` prop; reports `formState.isDirty` to parent
- `src/signatures/signature-form.tsx` — new `onDirtyChange` prop; reports `formState.isDirty` to parent
- `src/setup-wizard/__tests__/setup-wizard.spec.tsx`, `wizard-stepper.spec.tsx`, `welcome-step.spec.tsx`, `unsaved-changes-dialog.spec.tsx` — tests updated/added
