## ADDED Requirements

### Requirement: Unauthenticated shell footers expose legal navigation

The unauthenticated app shell footers SHALL keep the existing AGPL-3.0/source repository notice and SHALL also expose compact localized links to Terms of Service, Privacy Policy, and Cookies Policy. This requirement SHALL apply to both `AuthShell` and `EncryptionShell` so users can reach legal documents from signed-out and locked/encryption setup screens.

The legal navigation links SHALL use the active app locale and SHALL point to public legal document routes on `https://autokpo.com`.

#### Scenario: Auth shell footer shows legal links

- **WHEN** a user visits a route rendered inside `AuthShell`
- **THEN** the footer SHALL display the existing AGPL-3.0/source repository notice
- **AND** the footer SHALL display Terms of Service, Privacy Policy, and Cookies Policy links

#### Scenario: Encryption shell footer shows legal links

- **WHEN** a signed-in locked user views a screen rendered inside `EncryptionShell`
- **THEN** the footer SHALL display the existing AGPL-3.0/source repository notice
- **AND** the footer SHALL display Terms of Service, Privacy Policy, and Cookies Policy links

#### Scenario: Unauthenticated footer legal links use active locale URLs

- **WHEN** the active app locale is `sr-Latn`, `en`, or `ru`
- **THEN** footer legal links SHALL point to that locale's public legal document routes on `https://autokpo.com`

#### Scenario: Unauthenticated footer legal links are external

- **WHEN** a user activates a footer legal document link
- **THEN** the link SHALL open in a new browser tab
- **AND** the link SHALL use `rel="noopener noreferrer"`
