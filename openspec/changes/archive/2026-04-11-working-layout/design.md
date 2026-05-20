## Context

The app is a single-page React app. All state lives in React context backed by `localStorage`. The layout is currently a single `App` component rendering all forms inline (entity profile form, signature form, entries table, download button). Both `useEntityProfile()` and `useSignature()` already expose a nullable value — `profile: EntityProfile | null` and `signature: Signature | null` — which makes mode detection trivial without any new state.

## Goals / Non-Goals

**Goals:**

- Conditional layout rendering in `App` based on whether both profile and signature are present
- Working layout: responsive two-column layout — entries table as primary content (left on large screens); sidebar containing download button (bare), entity profile preview card, and signature preview card (right on large screens, first on mobile)
- Preview cards: all fields displayed in a `Surface variant="secondary"` data grid inside a `Card`; header has title + "Uredi" button
- Edit modals using HeroUI `Modal` wrapping the existing form components
- Forms close the modal on successful save via an `onSuccess` callback prop

**Non-Goals:**

- Ability to manually toggle between setup and working layout
- Persisting layout preference
- Any change to entries context, storage, or table behavior
- Redesigning the setup layout (extracted as `SetupLayout` module but content is otherwise unchanged)

## Decisions

### Mode detection at the App level (not a provider or router)

The condition `profile !== null && signature !== null` is evaluated inside `App` using the two existing context hooks. This is a render-level branch, not a route or a new provider. There's nothing async about it — both values are synchronously available from localStorage on mount.

Alternative: a dedicated `useShouldShowWorkingLayout()` hook. Rejected — unnecessary abstraction for a two-hook condition.

### Separate preview components (not a `readOnly` prop on forms)

`EntityProfilePreview` and `SignaturePreview` are new components alongside the existing form files. They own the Card shell, the Surface data grid, and the Modal. The existing forms remain single-responsibility (edit only) and receive only an `onSuccess` prop — a minimal, additive change.

Alternative: `readOnly` prop on forms that renders field values as text. Rejected — forms and previews have fundamentally different markup, mixing them adds conditional branching throughout the form component.

### Form pattern: `formId` prop, no submit button inside the form

`EntityProfileForm` and `SignatureForm` adopt the same pattern as `EntryForm`: the submit button is removed from inside the form, replaced by a required `formId` prop. The modal's `Modal.Footer` owns the `[Otkaži]` and `[Sačuvaj]` buttons, with `<Button type="submit" form={formId}>` targeting the form by id. `onSuccess?: () => void` is called after save and used by the modal to close itself.

The setup layout renders a `<Button type="submit" form={formId}>` alongside each form using `useId()` for the id.

Alternative: optional `formId` — form renders its own button when absent. Rejected — conditional rendering inside the form, inconsistency with the entry pattern.

### HeroUI component choices for preview

- **Card** — consistent with the rest of the app (entries table card, current profile/signature cards)
- **Surface variant="secondary"** — wraps the data grid to create visual separation from the card background without adding border or shadow complexity
- **`<dl>` grid (CSS grid, 2 columns)** — HeroUI has no description list component; a native `<dl>` with Tailwind grid classes is the correct and accessible choice
- **Modal** — HeroUI v3 compound modal pattern; trigger is the "Uredi" button in the card header; `Modal.Footer` owns `[Otkaži]` and `[Sačuvaj]`

### Setup layout: minimal wiring for external submit button

The setup branch in `App` uses `useId()` to generate a `formId` for each form and renders a `<Button type="submit" form={formId}>` in each card footer. Same pattern, different host.

## Risks / Trade-offs

- **Flash on first load**: If localStorage read is synchronous (it is), there's no layout flash — the correct layout renders immediately. No risk.
- **Preview shows stale data after external localStorage mutation**: Not a concern — data flows through context, which is the single source of truth for the running session.
- **Modal scroll on long form**: `EntityProfileForm` has 6 fields. On small screens the modal body may need to scroll. `Modal.Body` handles this natively. Low risk.
- **Setup layout needs external submit button**: Each form card in setup layout must render its own submit button outside the form using `form={formId}`. Small amount of wiring, consistent with the entry pattern.
