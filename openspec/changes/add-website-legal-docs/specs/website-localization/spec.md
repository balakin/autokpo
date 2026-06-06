## MODIFIED Requirements

### Requirement: Static localized website routes

The system SHALL provide static localized website pages for Serbian Latin, English, and Russian using Astro i18n routing with Serbian Latin as the default unprefixed locale.

#### Scenario: Serbian Latin root route renders

- **WHEN** a visitor opens `/`
- **THEN** the system displays the Serbian Latin landing page

#### Scenario: English route renders

- **WHEN** a visitor opens `/en/`
- **THEN** the system displays the English landing page

#### Scenario: Russian route renders

- **WHEN** a visitor opens `/ru/`
- **THEN** the system displays the Russian landing page

#### Scenario: Serbian Latin legal routes render

- **WHEN** a visitor opens `/privacy/`, `/terms/`, or `/cookies/`
- **THEN** the system displays the corresponding Serbian Latin legal document page

#### Scenario: English legal routes render

- **WHEN** a visitor opens `/en/privacy/`, `/en/terms/`, or `/en/cookies/`
- **THEN** the system displays the corresponding English legal document page

#### Scenario: Russian legal routes render

- **WHEN** a visitor opens `/ru/privacy/`, `/ru/terms/`, or `/ru/cookies/`
- **THEN** the system displays the corresponding Russian legal document page

#### Scenario: Static build generates localized routes

- **WHEN** the website production build runs
- **THEN** the build generates static output for landing and legal document routes without requiring `output: "server"`
