## MODIFIED Requirements

### Requirement: Stepper shown on form steps

The system SHALL display a `WizardStepper` with two steps — "Profil" and "Potpis" — on both the entity profile step and the signature step. The stepper SHALL NOT be shown on the welcome step.

#### Scenario: Stepper visible on profile step

- **WHEN** the wizard is on the entity profile step
- **THEN** a stepper with labels "Profil" and "Potpis" SHALL be visible

#### Scenario: Stepper visible on signature step

- **WHEN** the wizard is on the signature step
- **THEN** a stepper with labels "Profil" and "Potpis" SHALL be visible

#### Scenario: Stepper not shown on welcome step

- **WHEN** the wizard is on the welcome step
- **THEN** no stepper SHALL be rendered

### Requirement: Current step is marked active; future step is inactive

On the entity profile step, "Profil" SHALL have `data-status="active"` and "Potpis" SHALL have `data-status="upcoming"`. On the signature step, "Potpis" SHALL have `data-status="active"` and "Profil" SHALL have `data-status="complete"`.

#### Scenario: Profile step — Profil is active

- **WHEN** the wizard is on the entity profile step
- **THEN** the "Profil" step SHALL have `data-status="active"` and `aria-current="step"`
- **AND** the "Potpis" step SHALL have `data-status="upcoming"` and no `aria-current`

#### Scenario: Signature step — Potpis is active

- **WHEN** the wizard is on the signature step
- **THEN** the "Potpis" step SHALL have `data-status="active"` and `aria-current="step"`
- **AND** the "Profil" step SHALL have `data-status="complete"`

### Requirement: Completed step navigates back to that step

On the signature step, the "Profil" step SHALL be interactive. Pressing it SHALL navigate back to the entity profile step. On the profile step, the "Potpis" step SHALL NOT be interactive.

#### Scenario: Click Profil step from signature step

- **WHEN** the wizard is on the signature step and the user presses the "Profil" step
- **THEN** the wizard SHALL display the entity profile step

#### Scenario: Potpis step not interactive on profile step

- **WHEN** the wizard is on the entity profile step
- **THEN** the "Potpis" step SHALL NOT contain an interactive button element

## REMOVED Requirements

### Requirement: Labeled breadcrumbs shown on form steps

**Reason**: Replaced by `WizardStepper` using the `Stepper` component. See "Stepper shown on form steps".

**Migration**: Delete `WizardBreadcrumbs`. Render `<WizardStepper />` in its place.

### Requirement: Current step breadcrumb is marked active; future step is inactive

**Reason**: Superseded by "Current step is marked active; future step is inactive" above.

**Migration**: `data-status` / `aria-current` semantics are preserved via `Stepper`.

### Requirement: Completed breadcrumb navigates back to that step

**Reason**: Superseded by "Completed step navigates back to that step" above.

**Migration**: Navigation via `Stepper.Button` wrapping the "Profil" label on the signature step.
