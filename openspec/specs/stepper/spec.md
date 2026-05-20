## ADDED Requirements

### Requirement: Stepper renders steps with correct status

The Stepper component SHALL render each `Stepper.Step` with a status derived from its position relative to `activeStep`: steps before `activeStep` are `complete`, the step at `activeStep` is `active`, and steps after are `upcoming`. Status SHALL be reflected via `data-status` attribute on each step.

#### Scenario: Three-step stepper with second step active

- **WHEN** a Stepper renders with `activeStep={1}` and three `Stepper.Step` children
- **THEN** the first step has `data-status="complete"`, the second has `data-status="active"`, and the third has `data-status="upcoming"`

#### Scenario: First step is active by default

- **WHEN** a Stepper renders with `activeStep={0}`
- **THEN** the first step has `data-status="active"` and all others have `data-status="upcoming"`

### Requirement: Stepper is controlled via activeStep prop

The Stepper SHALL accept a required `activeStep` prop. The consumer owns the step state. When `activeStep` changes, step statuses SHALL update accordingly.

#### Scenario: Controlled mode reflects prop changes

- **WHEN** `activeStep` changes from `0` to `2`
- **THEN** the step statuses update accordingly — first two steps become `complete`, third becomes `active`

### Requirement: Stepper.Step supports completed override

A `Stepper.Step` SHALL accept an optional `completed` prop. When `completed={false}` on a step whose index is less than `activeStep`, the step SHALL have `data-status="upcoming"` instead of `complete`. This supports non-linear flows where a step is skipped.

#### Scenario: Skipped step is not marked complete

- **WHEN** a Stepper has `activeStep={2}` and the second step has `completed={false}`
- **THEN** the second step has `data-status="upcoming"`, not `complete`

#### Scenario: Without completed override, default behavior applies

- **WHEN** a Stepper has `activeStep={2}` and no step has a `completed` prop
- **THEN** the first and second steps have `data-status="complete"`

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

### Requirement: Step indicator shows step number or completion icon

The step indicator within `Stepper.Label` SHALL display the 1-based step number for `upcoming` and `active` steps. For `complete` steps, it SHALL display a check icon instead of the number.

#### Scenario: Active step shows number

- **WHEN** the second step is `active`
- **THEN** its indicator displays "2"

#### Scenario: Complete step shows check icon

- **WHEN** the first step is `complete`
- **THEN** its indicator displays a check icon (not the number)

### Requirement: Stepper supports horizontal and vertical orientation

The Stepper SHALL accept an `orientation` prop with values `horizontal` (default) or `vertical`. The orientation SHALL be reflected via `data-orientation` on the root element and affect the layout direction.

#### Scenario: Default horizontal orientation

- **WHEN** a Stepper renders without an `orientation` prop
- **THEN** the root element has `data-orientation="horizontal"`

#### Scenario: Vertical orientation

- **WHEN** a Stepper renders with `orientation="vertical"`
- **THEN** the root element has `data-orientation="vertical"`

### Requirement: Connectors are auto-inserted between steps

The Stepper SHALL automatically render a connector (line) between adjacent steps. The connector's appearance SHALL reflect the status of the preceding step — styled as `complete` when the step before it is complete, `upcoming` otherwise. Status SHALL be reflected via `data-status` attribute. A custom connector element can be provided via the `connector` prop on `Stepper`.

#### Scenario: Connector after a complete step

- **WHEN** the first step is `complete`
- **THEN** the connector after it has `data-status="complete"`

#### Scenario: Connector after an active step

- **WHEN** the first step is `active`
- **THEN** the connector after it has `data-status="upcoming"`

#### Scenario: Custom connector

- **WHEN** a Stepper renders with a `connector` prop providing a custom element
- **THEN** the custom element is rendered between steps instead of the default connector

#### Scenario: No connector after the last step

- **WHEN** a Stepper renders with three steps
- **THEN** connectors appear between steps 1-2 and 2-3, but not after step 3

### Requirement: Stepper uses accessible markup

The Stepper root SHALL use `role="list"` and each `Stepper.Step` SHALL use `role="listitem"`. The active step SHALL have `aria-current="step"`.

#### Scenario: Accessibility attributes are present

- **WHEN** a Stepper renders with three steps and `activeStep={1}`
- **THEN** the root has `role="list"`, each step has `role="listitem"`, and the second step has `aria-current="step"`

#### Scenario: Non-active steps do not have aria-current

- **WHEN** a Stepper renders with `activeStep={0}`
- **THEN** only the first step has `aria-current="step"`, others do not have the attribute
