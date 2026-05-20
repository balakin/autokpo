## MODIFIED Requirements

### Requirement: Stepper.Label displays title and optional description

`Stepper.Label` SHALL render its `children` as the step title. An optional `description` prop SHALL render secondary text below the title. A step indicator (number or check icon) SHALL be rendered before the title. `Stepper.Label` SHALL accept an optional `onClick` prop; when provided it becomes interactive (clickable, keyboard-focusable, Enter/Space activatable); when absent it renders as a visually identical but non-interactive element (excluded from tab order, pointer-events-none). The DOM element type SHALL always be a `<button>` regardless of `onClick` presence, ensuring the component never remounts when interactivity changes.

#### Scenario: Label with title only

- **WHEN** a `Stepper.Label` renders with children `"Profile"`
- **THEN** the text "Profile" is visible

#### Scenario: Label with title and description

- **WHEN** a `Stepper.Label` renders with children `"Profile"` and `description="Basic info"`
- **THEN** both "Profile" and "Basic info" are visible

#### Scenario: Interactive label fires handler on click

- **WHEN** a `Stepper.Label` is rendered with an `onClick` prop and is clicked
- **THEN** the `onClick` handler is invoked

#### Scenario: Non-interactive label is excluded from tab order

- **WHEN** a `Stepper.Label` is rendered without an `onClick` prop
- **THEN** it has `tabindex="-1"` and `pointer-events-none`

## REMOVED Requirements

### Requirement: Stepper.Button provides clickable step navigation with focus styles

**Reason**: `Stepper.Button` is redundant now that `Stepper.Label` directly renders a `<button>` and accepts an `onClick` prop. Removing it eliminates an extra abstraction layer and simplifies the public API.

**Migration**: Replace `<Stepper.Button onClick={fn}><Stepper.Label>...</Stepper.Label></Stepper.Button>` with `<Stepper.Label onClick={fn}>...</Stepper.Label>`.
