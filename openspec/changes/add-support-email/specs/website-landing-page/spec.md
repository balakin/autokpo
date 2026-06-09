## MODIFIED Requirements

### Requirement: Footer links and project metadata

The landing page SHALL include a localized footer on every supported locale page with GitHub, Cookies Policy, Privacy Policy, Terms of Service, AGPL-3.0 license, open-source project notes, and a support email link.

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

#### Scenario: Footer contains support email link

- **WHEN** a visitor reaches the footer on any localized landing page
- **THEN** the footer SHALL contain a `mailto:support@autokpo.com` link in the legal-links row
- **AND** the link label SHALL be the localized equivalent of "support@autokpo.com" in that page's locale
