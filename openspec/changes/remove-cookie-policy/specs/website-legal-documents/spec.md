## MODIFIED Requirements

### Requirement: Localized legal document pages

The system SHALL provide public static legal document pages for Privacy Policy and Terms of Service in every supported website locale.

#### Scenario: Serbian Latin legal documents render

- **WHEN** a visitor opens `/privacy/` or `/terms/`
- **THEN** the system displays the corresponding Serbian Latin legal document page without requiring authentication

#### Scenario: English legal documents render

- **WHEN** a visitor opens `/en/privacy/` or `/en/terms/`
- **THEN** the system displays the corresponding English legal document page without requiring authentication

#### Scenario: Russian legal documents render

- **WHEN** a visitor opens `/ru/privacy/` or `/ru/terms/`
- **THEN** the system displays the corresponding Russian legal document page without requiring authentication

### Requirement: English legal document slugs

The system SHALL use English URL slugs for legal document pages across all locales.

#### Scenario: Default locale uses English slugs

- **WHEN** Serbian Latin legal document routes are generated
- **THEN** the routes use `/privacy/` and `/terms/`

#### Scenario: Prefixed locales use English slugs

- **WHEN** English or Russian legal document routes are generated
- **THEN** the routes use the locale prefix followed by `/privacy/` or `/terms/`

### Requirement: Legal document cross-links

The system SHALL provide convenient localized links to Privacy Policy and Terms of Service from public website footers.

#### Scenario: Landing footer links legal documents

- **WHEN** a visitor reaches the footer on any localized landing page
- **THEN** the footer exposes links to that locale's Privacy Policy and Terms of Service pages

#### Scenario: Legal footer links legal documents

- **WHEN** a visitor reaches the footer on any localized legal document page
- **THEN** the footer exposes links to that locale's Privacy Policy and Terms of Service pages

## REMOVED Requirements

### Requirement: Cookies Policy pages

**Reason**: The app uses only strictly necessary session cookies, which are already covered in the Privacy Policy. A standalone Cookies Policy page is redundant.
**Migration**: No migration needed. Pages contained placeholder content only and were never linked from the app.
