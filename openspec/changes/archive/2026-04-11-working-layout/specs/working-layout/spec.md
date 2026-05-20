## ADDED Requirements

### Requirement: App renders setup layout when profile or signature is missing

The system SHALL render the setup layout (entity profile form card, signature form card, entries table card, download button) when either the entity profile or the signature is absent from localStorage.

#### Scenario: Neither profile nor signature exists

- **WHEN** the user opens the application for the first time with no data in localStorage
- **THEN** the app SHALL render the setup layout

#### Scenario: Profile exists but signature is missing

- **WHEN** the entity profile is saved but no signature exists
- **THEN** the app SHALL render the setup layout

#### Scenario: Signature exists but profile is missing

- **WHEN** the signature is saved but no entity profile exists
- **THEN** the app SHALL render the setup layout

---

### Requirement: App renders working layout when both profile and signature exist

The system SHALL render the working layout when both the entity profile and the signature are present in localStorage.

#### Scenario: Both profile and signature exist

- **WHEN** both entity profile and signature are saved in localStorage
- **THEN** the app SHALL render the working layout with rows: download button, entity profile preview, entries table, signature preview

#### Scenario: Working layout renders a two-column responsive layout

- **WHEN** the working layout is active on a large screen
- **THEN** the entries table card SHALL appear in the primary (left) column and the sidebar (download PDF button, entity profile preview card, signature preview card) SHALL appear in the secondary (right) column

#### Scenario: Working layout renders single-column on mobile

- **WHEN** the working layout is active on a small screen
- **THEN** the sidebar items (download PDF button, entity profile preview card, signature preview card) SHALL appear first, followed by the entries table card
