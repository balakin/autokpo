## Purpose

Display AGPL-3.0 license notices with links to the source repository in both the unauthenticated shell footer and the authenticated sidebar footer.

## Requirements

### Requirement: AGPL notice in unauthenticated shell

The `AuthShell` component SHALL display a footer containing an AGPL-3.0 license notice with a link to the source repository. The notice MUST be visible on all auth pages (login, registration, etc.) without requiring any user interaction.

#### Scenario: Notice visible on auth pages

- **WHEN** a user visits any unauthenticated route rendered by `AuthShell`
- **THEN** a footer is displayed at the bottom of the page containing the text "AGPL-3.0" and a link labeled with the translated "Source code" text pointing to the source repository URL

#### Scenario: Source link opens externally

- **WHEN** a user clicks the source code link in the auth shell footer
- **THEN** the link opens in a new browser tab (target="\_blank" with rel="noopener noreferrer")

### Requirement: AGPL notice in authenticated sidebar

The `Sidebar` component SHALL display a compact `AGPL-3.0 · [GitHub icon]` link in the bottom version footer, positioned to the right of the version badge. The link SHALL point to `https://github.com/balakin/autokpo`, open in a new tab, and render without underline decoration. The standalone AGPL text block and "Izvorni kod" labeled link that previously appeared as a separate section above the version badge are removed.

#### Scenario: Compact AGPL link visible in sidebar footer

- **WHEN** an authenticated user views the sidebar (desktop or mobile)
- **THEN** the version footer SHALL display the text "AGPL-3.0" and a GitHub icon as a single no-underline link to `https://github.com/balakin/autokpo`

#### Scenario: Source link opens externally

- **WHEN** a user clicks the AGPL-3.0 link in the sidebar footer
- **THEN** the link SHALL open in a new browser tab (`target="_blank"`, `rel="noopener noreferrer"`)

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

### Requirement: Source URL is hardcoded

The source repository URL SHALL be hardcoded to `https://github.com/balakin/autokpo` as a constant in each component that references it. No environment variable is used.

#### Scenario: URL is the canonical repository

- **WHEN** the AGPL notice is rendered in either `AuthShell`, `Sidebar`, or the help page
- **THEN** the source link href is `https://github.com/balakin/autokpo`

### Requirement: Notice text is translated

The human-readable label in the AGPL notice (e.g. "Source code") SHALL use the Lingui `<Trans>` macro so it is translated into all supported languages (Serbian, English, Russian).

#### Scenario: Label translated per locale

- **WHEN** the app locale is changed
- **THEN** the source link label in both notice locations reflects the translation for the active locale
