## ADDED Requirements

### Requirement: Wizard starts at welcome step on first visit

The system SHALL render the welcome step when neither entity profile nor signature has been saved (i.e., both context values are `null`).

#### Scenario: Fresh start with no data

- **WHEN** the user opens the app for the first time (no profile, no signature in localStorage)
- **THEN** the setup wizard SHALL display the welcome step with a "Počnite" button

---

### Requirement: Wizard resumes at signature step when profile exists but signature does not

The system SHALL skip the welcome step and render the signature step directly when an entity profile is already saved but no signature has been saved.

#### Scenario: Page reload mid-wizard after profile saved

- **WHEN** the user has a saved entity profile but no signature and opens the app
- **THEN** the setup wizard SHALL display the signature step, not the welcome step

---

### Requirement: Welcome step advances to profile step

The system SHALL advance to the entity profile step when the user presses "Počnite" on the welcome step.

#### Scenario: User clicks Počnite

- **WHEN** the user is on the welcome step and presses the "Počnite" button
- **THEN** the wizard SHALL display the entity profile step

---

### Requirement: Labeled breadcrumbs shown on form steps

The system SHALL display a labeled breadcrumb navigation with two items — "Profil" and "Potpis" — on both the entity profile step and the signature step. The breadcrumbs SHALL NOT be shown on the welcome step.

#### Scenario: Breadcrumbs visible on profile step

- **WHEN** the wizard is on the entity profile step
- **THEN** breadcrumbs with labels "Profil" and "Potpis" SHALL be visible

#### Scenario: Breadcrumbs visible on signature step

- **WHEN** the wizard is on the signature step
- **THEN** breadcrumbs with labels "Profil" and "Potpis" SHALL be visible

#### Scenario: Breadcrumbs not shown on welcome step

- **WHEN** the wizard is on the welcome step
- **THEN** no breadcrumb navigation SHALL be rendered

---

### Requirement: Current step breadcrumb is marked active; future step is inactive

On the entity profile step, "Profil" SHALL be marked as the current breadcrumb and "Potpis" SHALL appear inactive (visually muted, not interactive). On the signature step, "Potpis" SHALL be marked as current.

#### Scenario: Profile step — Profil is current

- **WHEN** the wizard is on the entity profile step
- **THEN** the "Profil" breadcrumb SHALL have `aria-current="page"`
- **AND** the "Potpis" breadcrumb SHALL NOT be interactive

#### Scenario: Signature step — Potpis is current

- **WHEN** the wizard is on the signature step
- **THEN** the "Potpis" breadcrumb SHALL have `aria-current="page"`

---

### Requirement: Completed breadcrumb navigates back to that step

On the signature step, the "Profil" breadcrumb SHALL be interactive. Pressing it SHALL navigate back to the entity profile step.

#### Scenario: Click Profil breadcrumb from signature step

- **WHEN** the wizard is on the signature step and the user presses the "Profil" breadcrumb
- **THEN** the wizard SHALL display the entity profile step

---

### Requirement: Profile step advances on successful form submission

The system SHALL advance from the entity profile step to the signature step when the entity profile form is submitted successfully.

#### Scenario: Valid profile submitted

- **WHEN** the wizard is on the entity profile step and the user submits a valid entity profile form
- **THEN** the wizard SHALL display the signature step

---

### Requirement: Signature step completes setup on successful form submission

The system SHALL complete setup when the signature form is submitted successfully on the signature step. Completing setup causes `App` to re-render into `WorkingLayout` (since both profile and signature are now non-null in their contexts).

#### Scenario: Valid signature submitted

- **WHEN** the wizard is on the signature step and the user submits a valid signature form
- **THEN** both entity profile and signature SHALL be saved
- **AND** the application SHALL render the working layout
