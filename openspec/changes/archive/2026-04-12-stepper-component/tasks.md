## 1. Foundation

- [x] 1.1 Create `src/ui/stepper/` directory and barrel `index.ts`
- [x] 1.2 Create `stepper-context.ts` with shared context type (activeStep, orientation, step index counter)
- [x] 1.3 Create `stepper-variants.ts` with slot class definitions using Tailwind v4 + HeroUI CSS variables

## 2. Core Components

- [x] 2.1 Implement `stepper-root.tsx` — accepts `activeStep`, `orientation`, `connector`; provides context; renders `role="list"` with `data-orientation`; auto-inserts connectors between step children
- [x] 2.2 Implement `stepper-step.tsx` — reads index from context; computes status from `activeStep` with `completed` override; always renders as `<div>`; sets `data-status`, `role="listitem"`, `aria-current="step"`
- [x] 2.5 Implement `stepper-button.tsx` — wraps HeroUI's Button component as a `<button type="button">`; `data-slot="step-button"`; applies `stepperSlots.button` (background change on focus-visible for keyboard indication)
- [x] 2.3 Implement `stepper-label.tsx` — renders step indicator (number or check icon), title from `children`, optional `description` prop
- [x] 2.4 Implement `stepper-connector.tsx` — default connector line; reads status from preceding step via context; sets `data-status`

## 3. Assembly

- [x] 3.1 Wire up compound `Stepper` object in `index.ts` with dot-notation (`Stepper.Step`, `Stepper.Button`, `Stepper.Label`, `Stepper.Connector`)

## 4. Tests

- [x] 4.1 Test step status rendering (complete/active/upcoming based on activeStep)
- [x] 4.2 Test `completed` override (skipped step stays upcoming)
- [x] 4.3 Test Label with title and description
- [x] 4.4 Test step indicator (number for active/upcoming, check icon for complete)
- [x] 4.5 Test horizontal and vertical orientation via `data-orientation`
- [x] 4.6 Test auto-inserted connectors with correct `data-status`
- [x] 4.7 Test `Stepper.Button`: step is always `<div>`; button renders as `<button>`; handler fires on click; focus-visible styling is applied via data attributes
- [x] 4.8 Test accessibility attributes (role="list", role="listitem", aria-current="step")
- [x] 4.9 Test custom connector via `connector` prop
