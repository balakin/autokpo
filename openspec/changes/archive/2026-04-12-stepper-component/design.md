## Context

The project needs a reusable Stepper component for multi-step flows. HeroUI v3 does not ship a Stepper, so we build a custom one. The setup wizard currently uses ad-hoc breadcrumbs for step navigation — a proper Stepper would be a better primitive (adoption is out of scope here).

MUI's Stepper is used as the primary API inspiration, adapted to HeroUI v3's compound component conventions:

- **Compound components** via dot-notation (e.g., `Stepper.Step`, `Stepper.Label`).
- **Context-based slot styling** — a root component creates a variants instance and shares it via React context; children read slot classes from context.
- **`data-slot` attributes** on every element for external styling hooks.
- **`displayName`** set as `KPO.Stepper.*` to distinguish from HeroUI built-in components.

## Goals / Non-Goals

**Goals:**

- Provide a compound `Stepper` component at `src/ui/stepper/` that feels native to HeroUI v3, with API inspired by MUI Stepper.
- Support controlled mode via `activeStep` prop. Consumer owns the state.
- Support horizontal and vertical orientations.
- Each step has a status derived from its index vs the active step: `complete`, `active`, or `upcoming`. Steps can override their `completed` status (for non-linear/skip flows).
- Auto-insert connectors between steps (no manual separator placement).
- Accessible: uses `aria-current="step"` on the active item, `role="list"` / `role="listitem"` semantics.
- Ship with Vitest + RTL tests.

**Non-Goals:**

- No React Aria Components dependency — this is a simple presentational component, not a complex interactive widget.
- No variant system via `@heroui/styles` (we don't own that package). Styling uses Tailwind v4 utility classes with HeroUI CSS variables for design token alignment.
- No `StepContent` (collapsible content for vertical steps) — can be added later.
- No `alternativeLabel` (label below icon) — can be added later.
- No `MobileStepper` — different component entirely.
- Not migrating the setup wizard to use this component in this change.

## Decisions

### 1. Compound component API inspired by MUI, adapted to HeroUI conventions

**Choice**: Root component creates context; sub-components consume it. The composition follows MUI's `Stepper` > `Step` > `StepLabel` nesting, but uses HeroUI's dot-notation.

```tsx
<Stepper activeStep={1}>
  <Stepper.Step>
    <Stepper.Label>Profile</Stepper.Label>
  </Stepper.Step>
  <Stepper.Step>
    <Stepper.Label description="Optional">Signature</Stepper.Label>
  </Stepper.Step>
  <Stepper.Step>
    <Stepper.Label>Done</Stepper.Label>
  </Stepper.Step>
</Stepper>
```

Connectors are auto-inserted between `Stepper.Step` children — no manual `Stepper.Connector` placement needed. A custom connector can be provided via the `connector` prop on `Stepper`.

**Why this composition over flat props**: `Stepper.Step` as a wrapper allows future extensibility (e.g., adding `StepContent` for vertical layouts) without API changes. `Stepper.Label` takes `children` for the title text (like MUI's `StepLabel`), which is more natural for React than a `title` prop.

**Why over a config-array API**: Matches HeroUI v3 patterns (Tabs, ProgressBar, Card). Gives consumers full control over rendering.

### 2. Step status derived from index, with `completed` override

**Choice**: Each `Stepper.Step` receives its index via context. By default, status is computed: `index < activeStep` → complete, `index === activeStep` → active, `index > activeStep` → upcoming.

A `Stepper.Step` can override this with an explicit `completed` prop (like MUI). When `completed={false}` on a step before `activeStep`, it shows as incomplete even though it was "passed". This supports skip/non-linear flows.

**Why**: Default index-based logic covers the common linear case. The `completed` override adds flexibility for non-linear flows without complicating the common path.

### 3. Interactive steps via a dedicated Stepper.Button sub-component

**Choice**: A dedicated `Stepper.Button` sub-component wraps step content and renders as a `<button type="button">` element. It provides hover and focus-visible ring styles and fires an `onClick` handler. `Stepper.Step` is always a `<div>` — it owns status context but no interactivity.

```tsx
<Stepper.Step>
  <Stepper.Button onClick={() => setActiveStep(0)}>
    <Stepper.Label>Profile</Stepper.Label>
  </Stepper.Button>
</Stepper.Step>
```

**Why a separate component over an `onClick` prop on `Stepper.Step`**: MUI's `StepButton` approach is a clear separation of concerns — `Step` is a layout/status container; `StepButton` is the interactive affordance. This keeps the interactive styles (hover background, focus ring) isolated from the structural container, and makes the API explicit: a consumer can see at a glance whether a step is clickable without inspecting props. It also avoids the conditional element type (`button` vs `div`) pattern which makes type inference awkward.

**Focus styles**: `Stepper.Button` wraps HeroUI's `Button` component (variant="ghost") to provide semantic button markup and native keyboard interaction. Focus-visible styling is applied via data attributes, with the background changing on focus (using HeroUI's `bg-default` token) to provide a clear visual indicator for keyboard users.

### 4. Styling approach — Tailwind v4 utilities + HeroUI CSS variables

**Choice**: Define slot class strings in a local `stepper-variants.ts` file (plain functions, not `@heroui/styles`). Reference HeroUI design tokens via CSS variables (`--heroui-*` for colors, radii, etc.) inside Tailwind classes.

**Why over inline styles**: Consistent with the project's Tailwind v4 setup. Why not `@heroui/styles`: that's an internal HeroUI package; we can't add variants to it. A local variants function gives us the same slot-based pattern.

### 5. Indicator transition animation

**Choice**: The step indicator (number → check icon transition) uses `react-transition-group` (`SwitchTransition` + `CSSTransition`) to provide a smooth visual transition when a step moves from `active`/`upcoming` to `complete` status. Transitions are CSS-based, defined in `stepper-label.module.css`, with scale and rotation effects (exit: shrink + rotate; enter: grow + counter-rotate using cubic-bezier easing).

**Why**: The animation provides visual feedback that a step has been completed, improving the UX of multi-step flows. `react-transition-group` is a lightweight, well-maintained library for orchestrating CSS-driven transitions in React.

### 6. File structure

```
src/ui/stepper/
  index.ts                   # barrel export + compound Stepper object
  stepper-root.tsx           # Stepper root provider
  stepper-step.tsx           # Stepper.Step wrapper (always <div>; owns status context)
  stepper-button.tsx         # Stepper.Button (interactive <button> with HeroUI Button component)
  stepper-label.tsx          # Stepper.Label (animated icon + title + description)
  stepper-label.module.css   # CSS animations for indicator transitions
  stepper-connector.tsx      # Stepper.Connector (line between steps)
  stepper-context.ts         # shared React context
  stepper-variants.ts        # slot class definitions
  __tests__/
    stepper.spec.tsx         # Vitest + RTL tests
```

**Why one file per component**: React Fast Refresh (`@vitejs/plugin-react`) bails out of HMR for files that export multiple components. Splitting keeps hot reload working during development. The barrel `index.ts` assembles the compound `Stepper` object with dot-notation.

## Risks / Trade-offs

- **Index-based status breaks with conditional rendering** — if a `Stepper.Step` is conditionally omitted mid-list, indices shift. → Mitigation: document that all steps should always render; consumers can visually hide steps but should not conditionally mount them. This is the same constraint HeroUI Tabs has.
- **No React Aria primitives means manual a11y** — we handle `role`, `aria-current`, and keyboard semantics ourselves. → Mitigation: the root uses `role="list"` and steps use `role="listitem"`. `Stepper.Button` is always a `<button>` element, giving native keyboard support (Enter/Space activation, focusability, focus-visible ring) for free. No custom keyboard handling needed.
- **Auto-inserted connectors reduce flexibility** — consumers can't place connectors arbitrarily. → Mitigation: a `connector` prop on `Stepper` accepts a custom ReactNode to replace the default connector, matching MUI's approach.
