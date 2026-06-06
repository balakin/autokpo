## ADDED Requirements

### Requirement: Help page contains legal document links

The `HelpPage` component SHALL include a localized legal/privacy section that links to the public Terms of Service, Privacy Policy, and Cookies Policy documents for the active app locale. The section SHALL follow the existing Help page card composition pattern, use a HeroUI `Card`, use a Lucide icon, and wrap user-visible text with Lingui macros.

#### Scenario: Help page displays legal document section

- **WHEN** a signed-in user views the `/help` page
- **THEN** the page SHALL display a legal/privacy card section
- **AND** the section SHALL contain links to Terms of Service, Privacy Policy, and Cookies Policy

#### Scenario: Help legal links use active locale URLs

- **WHEN** the active app locale is `sr-Latn`, `en`, or `ru`
- **THEN** the Help page legal document links SHALL point to that locale's public legal document routes on `https://autokpo.com`

#### Scenario: Help legal links are external

- **WHEN** a signed-in user activates any legal document link on the Help page
- **THEN** the link SHALL open in a new browser tab
- **AND** the link SHALL use `rel="noopener noreferrer"`
