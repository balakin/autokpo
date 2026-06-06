## MODIFIED Requirements

### Requirement: Footer links and project metadata

The landing page SHALL include a localized footer on every supported locale page with GitHub, Cookies Policy, Privacy Policy, Terms of Service, AGPL-3.0 license, and open-source project notes.

#### Scenario: Footer exposes project source

- **WHEN** a visitor reaches the footer on any localized landing page
- **THEN** the visitor can navigate to the AutoKPO GitHub repository

#### Scenario: Footer links legal documents

- **WHEN** a visitor reaches the footer on any localized landing page
- **THEN** the visitor can navigate to that locale's Cookies Policy, Privacy Policy, and Terms of Service pages

#### Scenario: Footer mentions license

- **WHEN** a visitor reaches the footer on any localized landing page
- **THEN** the footer mentions AGPL-3.0 licensing in that page's locale

#### Scenario: Footer mentions project author

- **WHEN** a visitor reaches the footer on any localized landing page
- **THEN** the footer includes a project author note linking to the author's GitHub profile in that page's locale
