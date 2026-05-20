## 1. Cleanup

- [x] 1.1 Delete `src/setup-layout/setup-layout.tsx`
- [x] 1.2 Delete `src/setup-layout/__tests__/setup-layout.spec.tsx`

## 2. WelcomeStep component

- [x] 2.1 Create `src/setup-wizard/welcome-step.tsx` — renders a card with app title, description, and "Počnite" button; accepts `onNext: () => void` prop
- [x] 2.2 Create `src/setup-wizard/__tests__/welcome-step.spec.tsx` — test: card renders; test: pressing "Počnite" calls `onNext`

## 3. ProfileStep component

- [x] 3.1 Create `src/setup-wizard/profile-step.tsx` — renders `WizardBreadcrumbs step="profile"` and an `EntityProfileForm` card with an external submit button; accepts `onNext: () => void` prop
- [x] 3.2 Create `src/setup-wizard/__tests__/profile-step.spec.tsx` — test: breadcrumbs list renders; test: submitting a valid form calls `onNext`

## 4. SignatureStep component

- [x] 4.1 Create `src/setup-wizard/signature-step.tsx` — renders `WizardBreadcrumbs step="signature" onProfileClick={onBack}` and a `SignatureForm` card with an external submit button; accepts `onBack: () => void` prop; `onSuccess` on the form is omitted (App re-renders automatically when signature context updates)
- [x] 4.2 Create `src/setup-wizard/__tests__/signature-step.spec.tsx` — test: breadcrumbs list renders; test: pressing Profil breadcrumb calls `onBack`

## 5. WizardBreadcrumbs component

- [x] 5.1 Create `src/setup-wizard/wizard-breadcrumbs.tsx` — accepts `step: 'profile' | 'signature'` and `onProfileClick?: () => void`; renders the two-item HeroUI Breadcrumbs with correct active/dimmed/clickable state for each step
- [x] 5.2 Create `src/setup-wizard/__tests__/wizard-breadcrumbs.spec.tsx` — tests for `step="profile"`: labels render, Profil is not a button, Potpis is aria-disabled; tests for `step="signature"`: labels render, Profil is a button, Potpis has `aria-current="page"`, clicking Profil calls `onProfileClick`

## 6. SetupWizard orchestrator

- [x] 6.1 Create `src/setup-wizard/setup-wizard.tsx` — owns step state (`'welcome' | 'profile' | 'signature'`), derives initial step from context (no profile → `'welcome'`; profile but no signature → `'signature'`), renders the correct step component with navigation callbacks
- [x] 6.2 Create `src/setup-wizard/__tests__/setup-wizard.spec.tsx` — test: renders welcome step when no profile and no signature; test: renders signature step when profile exists but signature is null; test: advancing from welcome to profile step works end-to-end

## 7. App wiring

- [x] 7.1 Update `src/app.tsx` to import and render `SetupWizard` instead of `SetupLayout`
- [x] 7.2 Update `src/app.spec.tsx` to reference `SetupWizard` instead of `SetupLayout` if applicable
