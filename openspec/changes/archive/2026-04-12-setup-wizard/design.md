## Context

The current `SetupLayout` renders both forms simultaneously as stacked cards with independent save buttons. It provides no orientation or sense of progress. `App.tsx` decides which layout to show based on whether `profile` and `signature` are both non-null in their respective contexts.

Both `EntityProfileForm` and `SignatureForm` already accept `formId` and `onSuccess` props — no changes are needed to either form.

## Goals / Non-Goals

**Goals:**

- Replace `SetupLayout` with a multi-step `SetupWizard`
- Guide new users through Welcome → Entity Profile → Signature in sequence
- Show labeled breadcrumb navigation (Profil / Potpis) on form steps
- Allow backward navigation by clicking a completed breadcrumb
- Resume mid-wizard: skip directly to the first incomplete step on reload

**Non-Goals:**

- Animated step transitions
- Settings access from `WorkingLayout` (editing profile/signature post-setup is a separate feature)
- Any changes to `EntityProfileForm`, `SignatureForm`, or their providers

## Decisions

### 1. Step state managed locally in `SetupWizard` via `useState`

**Type:** `'welcome' | 'profile' | 'signature'`

Initial value is derived once at mount from context:

- `profile === null` → `'welcome'`
- `profile !== null && signature === null` → `'signature'` (resume mid-wizard, skip welcome)

**Alternative considered:** Derive current step dynamically from context on every render.  
**Rejected:** Would snap the user back to an earlier step if they navigate back and re-save a form — the step would jump forward immediately, losing their navigation intent.

### 2. Breadcrumbs extracted into a shared `WizardBreadcrumbs` component

Breadcrumb logic is extracted into `src/setup-wizard/wizard-breadcrumbs.tsx` so neither step embeds its own `Breadcrumbs` markup. The component accepts `step: 'profile' | 'signature'` and `onProfileClick?: () => void`.

Both steps (Profil, Potpis) are always rendered. States per item:

| `step`        | Profil crumb                                                                             | Potpis crumb                                       |
| ------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `'profile'`   | `Breadcrumbs.Item` (no `href`, rendered as a plain link by HeroUI)                       | `Breadcrumbs.Item` (no `href`, muted via Tailwind) |
| `'signature'` | `Breadcrumbs.Item` with a children render function that emits a `<button onClick={...}>` | `Breadcrumbs.Item` (no `href`, `aria-current`)     |

HeroUI marks the last item without `href` as current (`data-current="true"`, `aria-current="page"`). For the "future" Potpis crumb on the profile step, we add `className="opacity-50 pointer-events-none"` to communicate its inactive state visually.

For the clickable Profil crumb on the signature step, we pass a children render function `{() => <button onClick={onProfileClick}>Profil</button>}`, avoiding actual URL navigation in this SPA. The `Breadcrumbs` component renders its own separator between items, so no manual separator icon is needed.

Breadcrumbs are **not shown** on the Welcome step — the welcome screen has no context to navigate from.

**Alternative considered:** Custom-built step indicator (plain HTML/Tailwind).  
**Rejected:** HeroUI Breadcrumbs provides correct ARIA semantics and `aria-current="page"` automatically, reducing accessibility work.

### 3. `SetupLayout` is fully removed, not refactored

There are no external consumers of `SetupLayout` beyond `App.tsx`. Deleting both `setup-layout.tsx` and its test file is clean; no deprecation shim is needed.

### 4. Each wizard step is its own component

Each step is extracted into a dedicated file inside `src/setup-wizard/`:

| File                     | Responsibility                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `welcome-step.tsx`       | Welcome card + "Počnite" button; accepts `onNext: () => void`                                      |
| `profile-step.tsx`       | `WizardBreadcrumbs` + EntityProfileForm card; accepts `onNext: () => void`                         |
| `signature-step.tsx`     | `WizardBreadcrumbs` + SignatureForm card; accepts `onBack: () => void`                             |
| `wizard-breadcrumbs.tsx` | Two-item breadcrumb bar shared by profile and signature steps; accepts `step` and `onProfileClick` |
| `setup-wizard.tsx`       | Orchestrator: owns step state, derives initial step, renders the right step component              |

Step components receive navigation callbacks as props and have no direct dependency on step state. This makes each step independently renderable and testable without needing to drive the full wizard.

**Alternative considered:** Inline all steps inside `SetupWizard` as conditional JSX branches.  
**Rejected:** Harder to test in isolation; the orchestrator grows large as the form logic and breadcrumb logic are all mixed together.

### 5. `App.tsx` updated to import `SetupWizard`

The conditional logic in `App.tsx` (`profile !== null && signature !== null`) remains unchanged — `SetupWizard` is simply substituted for `SetupLayout`.

## Risks / Trade-offs

**`Breadcrumbs.Item` children render function** — HeroUI v3 Breadcrumbs uses `href` as the primary interactivity mechanism. The back-navigation Profil crumb uses the children render function API (`children: RenderFunction`) to emit a `<button>` instead of an anchor. This is documented and supported; the click handler is covered by the `WizardBreadcrumbs` Vitest suite.

**Welcome step skipped on resume** — A returning user who has profile saved but not signature skips the welcome screen and lands directly on the signature step. This is intentional (they've seen the welcome already) but means the welcome screen is only ever shown on a truly fresh start.  
→ Accepted trade-off: consistent with how the existing `App.tsx` logic works (no "have you seen the welcome?" flag needed).

**No dirty-form guard on breadcrumb back-navigation** — If the user edits the profile form and then clicks the Profil breadcrumb _without submitting_, their unsaved edits are discarded (form resets to last saved state on re-render).  
→ Accepted trade-off: the form always reflects what is actually persisted; no additional state management needed.
