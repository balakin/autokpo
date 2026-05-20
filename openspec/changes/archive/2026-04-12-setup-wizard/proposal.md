## Why

The current setup layout presents both the entity profile form and the signature form simultaneously as stacked cards, giving new users no orientation or sense of progress. Replacing it with a guided wizard improves first-time onboarding by introducing the app, walking users through each required form one step at a time, and providing clear navigation via labeled breadcrumbs.

## What Changes

- **NEW**: `SetupWizard` component replaces `SetupLayout` as the initial onboarding experience
- **NEW**: Welcome step with app introduction and a "Počnite" (Get Started) call-to-action
- **NEW**: Labeled breadcrumb navigation (`Profil → Potpis`) showing current step and completion state
- **NEW**: Clickable breadcrumbs allowing navigation back to previously completed steps
- **NEW**: Resume logic — wizard skips to the first incomplete step (if profile is already saved, lands on signature step)
- **REMOVED**: `SetupLayout` component (replaced entirely by `SetupWizard`)
- `App` renders `SetupWizard` instead of `SetupLayout` when setup is incomplete

## Capabilities

### New Capabilities

- `setup-wizard`: Multi-step onboarding wizard that guides new users through entity profile and signature setup, with labeled breadcrumb navigation and resume support

### Modified Capabilities

- `setup-layout`: Existing spec describes the two-card stacked layout — this requirement is superseded by the wizard. Spec will be replaced.

## Impact

- `src/setup-layout/setup-layout.tsx` — deleted
- `src/setup-layout/__tests__/setup-layout.spec.tsx` — deleted, replaced by wizard test
- `src/app.tsx` — updated to import `SetupWizard` instead of `SetupLayout`
- New files: `src/setup-wizard/setup-wizard.tsx`, `src/setup-wizard/__tests__/setup-wizard.spec.tsx`
- No changes to `EntityProfileForm`, `SignatureForm`, or their providers/contexts
- No new dependencies required (HeroUI already available)
