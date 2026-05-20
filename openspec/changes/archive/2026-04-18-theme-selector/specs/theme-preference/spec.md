## ADDED Requirements

### Requirement: Theme preference is persisted to localStorage

The system SHALL store the user's theme preference in `localStorage` under the key `kpo:theme`. Valid values are `"light"`, `"dark"`, and `"system"`. If the stored value is absent or invalid, the system SHALL fall back to `"system"`.

#### Scenario: Preference survives page reload

- **WHEN** the user selects a theme preference
- **THEN** the preference SHALL be written to `localStorage["kpo:theme"]`
- **AND** on subsequent page loads the system SHALL read and re-apply the stored preference

#### Scenario: Missing or invalid value defaults to system

- **WHEN** `localStorage["kpo:theme"]` is absent or contains an unrecognised value
- **THEN** the system SHALL behave as if the preference is `"system"`

---

### Requirement: Theme class is applied to the HTML element

The system SHALL reflect the active theme by setting `class` and `data-theme` attributes on the `<html>` element to either `"light"` or `"dark"` (resolved from the preference).

#### Scenario: Light preference applies light class

- **WHEN** the stored preference is `"light"`
- **THEN** `<html>` SHALL have `class="light"` and `data-theme="light"`

#### Scenario: Dark preference applies dark class

- **WHEN** the stored preference is `"dark"`
- **THEN** `<html>` SHALL have `class="dark"` and `data-theme="dark"`

#### Scenario: System preference follows OS setting

- **WHEN** the stored preference is `"system"`
- **AND** the OS is set to dark mode (`prefers-color-scheme: dark`)
- **THEN** `<html>` SHALL have `class="dark"` and `data-theme="dark"`

#### Scenario: System preference follows OS light setting

- **WHEN** the stored preference is `"system"`
- **AND** the OS is set to light mode
- **THEN** `<html>` SHALL have `class="light"` and `data-theme="light"`

---

### Requirement: Theme is initialised before React renders

The system SHALL apply the correct theme class to `<html>` before any React content renders to prevent a flash of the wrong theme.

#### Scenario: No theme flash on load

- **WHEN** the page loads with a stored dark preference
- **THEN** the `<html>` element SHALL have the dark class set before any visible content appears

---

### Requirement: System theme reacts to OS changes

The system SHALL update the active theme in real time when the OS theme changes and the user's preference is `"system"`.

#### Scenario: OS switches to dark while preference is system

- **WHEN** the user's preference is `"system"`
- **AND** the OS switches from light to dark
- **THEN** `<html>` class SHALL change to `"dark"` without a page reload
