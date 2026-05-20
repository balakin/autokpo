## Context

The setup wizard currently renders the welcome step outside the stepper flow — `SetupWizard` returns `<WelcomeStep>` early before the stepper is mounted. The stepper container is constrained to `max-w-3xl`, and each step card also carries its own `max-w-2xl`. The app-shell redesign means the wizard now renders inside the AppShell content area, so the stepper should span the full content width while step cards remain readable at `max-w-2xl`.

## Goals / Non-Goals

**Goals:**

- Stepper spans full width of the content area (no `max-w` on the stepper row)
- Step content (cards) is `max-w-2xl` and centered horizontally (`mx-auto`)
- `WizardStep` type gains a `'start'` value; the stepper shows three steps: Početak → Profil → Potpis
- `welcome-step.tsx` is renamed to `start-step.tsx`; `WelcomeStep` component renamed to `StartStep`
- `StartStep` content explains what the user needs to do (lists the two upcoming steps) and includes a note that all data can be changed later
- The `'start'` step label in the stepper is non-clickable at all times (completed start step cannot be navigated back to)
- Initial step for a fresh book is `'start'`; for a returning user with a profile it remains `'signature'`

**Non-Goals:**

- No new external dependencies

## Decisions

**1. Welcome as step 0, not a pre-stepper view**

Previously, welcome bypassed the stepper entirely. Integrating it as step 0 keeps the layout consistent — the stepper is always visible, and the user sees their progress from the moment they land on the wizard. The stepper label for step 0 will be "Početak".

**2. Start step is non-navigable once left**

The `'start'` step's `Stepper.Label` has no `onClick` handler regardless of current step. Unlike the `'profile'` step (which stays clickable from `'signature'`), start is a one-way gate — there is no useful reason to return to it. This matches the existing pattern where only backward-navigable steps get a handler.

**3. StartStep content framing and descriptions**

The heading is "Podešavanje knjige" — not a welcome greeting, since the user already started using the app by creating the book. Potpis is described as "odgovorno lice i sastavljač za PDF" (not "digitalni potpis"), accurately reflecting that it is two text fields used in the PDF footer. The "can change later" note uses normal text prominence (`text-default-600`), not small/muted styling, so it reads as a peer paragraph rather than a footnote.

**4. Stepper full-width, content max-w-2xl**

Remove the `max-w-3xl` wrapper around `<WizardStepper>`. Each step's content div gets `max-w-2xl mx-auto w-full`. The stepper component itself already renders `w-full` internally, so the outer constraint was the only thing limiting it.

**5. Rename file and component**

`welcome-step.tsx` → `start-step.tsx`, `WelcomeStep` → `StartStep`, `onNext` prop retained. The `WizardStep` union type gains `'start'` and drops `'welcome'`.

**6. Unsaved changes guard**

`SetupWizard` tracks a boolean `isDirty` state fed by `onDirtyChange` callbacks from `ProfileStep` and `SignatureStep`. Stepper-click navigation goes through `handleSetStep`, which intercepts when dirty and queues a `pendingStep` instead of navigating. In-app route navigation is blocked by `useBlocker(isDirty)`. Both paths share a single `UnsavedChangesDialog`; confirming either clears the pending navigation and proceeds, cancelling leaves the user on the current step.

Form success (`onNext`) calls a separate `handleFormSuccess` that clears `isDirty` before navigating — bypassing the guard so a successful save always advances without triggering the dialog.

**7. `onDirtyChange` reporting**

Both `EntityProfileForm` and `SignatureForm` expose an `onDirtyChange?: (isDirty: boolean) => void` prop. A stabilised callback (`useCallback` wrapping the prop) is called inside a `useEffect([formState.isDirty])`. This avoids stale-closure problems and keeps the form's internal state in sync with the wizard's dirty flag.

## Risks / Trade-offs

- Existing tests reference `WelcomeStep` and `'welcome'` step value — all must be updated → covered in tasks
- Stepper going full-width may look wide on large screens; acceptable since the AppShell sidebar already constrains visual weight on the left

## Migration Plan

No data migration needed — step state is ephemeral (`useState`). No localStorage changes.
