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

---

### Requirement: ThemeProvider is mounted above the router

The system SHALL render `ThemeProvider` above the router, outside `AuthProvider`, so that the active theme applies to both the auth page and the signed-in application. `ThemeProvider` SHALL NOT be rendered inside `SignedInApp`.

#### Scenario: Auth page receives active theme

- **WHEN** the user opens the application while signed out
- **THEN** the `<html>` element SHALL already have the correct theme class applied
- **AND** the auth page SHALL render with the user's stored theme preference

---

### Requirement: Theme syncs across open tabs via storage event

The system SHALL add a `storage` event listener in `ThemeProvider` that reacts to changes to the `autokpo:theme` key in `localStorage`. When another tab writes a new theme preference, the listening tab SHALL update its state and re-apply the theme to the DOM.

#### Scenario: Theme change in one tab propagates to other tabs

- **WHEN** the user changes the theme preference in one browser tab
- **THEN** all other open tabs SHALL update to the new theme within one event loop tick
- **AND** the `<html>` element in each tab SHALL reflect the new theme class

#### Scenario: storage event for unrelated key is ignored

- **WHEN** a `storage` event fires for a key other than `autokpo:theme`
- **THEN** `ThemeProvider` SHALL NOT update its state or re-apply the DOM theme

---

### Requirement: Auth page provides compact theme preference control

The auth page SHALL provide a gear icon button (`LuSettings`) in its page header that opens a theme and language preference panel. On desktop (viewport at or above the `lg` breakpoint), pressing the button SHALL open a `Popover` positioned at `bottom end`. On mobile (viewport below the `lg` breakpoint), pressing the button SHALL open a `Drawer` from the right edge. The panel SHALL contain language and theme selects with visible labels. The theme control SHALL allow choosing light, dark, or system theme and SHALL use the existing `ThemeProvider` state and persistence behavior.

#### Scenario: Signed-out user changes theme from auth header

- **WHEN** a signed-out user opens the preferences panel via the gear button in the auth header
- **AND** selects a theme from the panel
- **THEN** the active theme SHALL update immediately
- **AND** the selected preference SHALL be persisted through the existing theme preference storage
- **AND** the sign-in page SHALL remain on `/sign-in`
- **AND** the panel SHALL close

#### Scenario: Signed-out user changes language from auth header

- **WHEN** a signed-out user opens the preferences panel via the gear button in the auth header
- **AND** selects a language from the panel
- **THEN** the application locale SHALL update immediately
- **AND** the sign-in page SHALL remain on `/sign-in`
- **AND** the panel SHALL close
