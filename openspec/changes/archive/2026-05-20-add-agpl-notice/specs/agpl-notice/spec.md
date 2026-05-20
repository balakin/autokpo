## ADDED Requirements

### Requirement: AGPL notice in unauthenticated shell

The `AuthShell` component SHALL display a footer containing an AGPL-3.0 license notice with a link to the source repository. The notice MUST be visible on all auth pages (login, registration, etc.) without requiring any user interaction.

#### Scenario: Notice visible on auth pages

- **WHEN** a user visits any unauthenticated route rendered by `AuthShell`
- **THEN** a footer is displayed at the bottom of the page containing the text "AGPL-3.0" and a link labeled with the translated "Source code" text pointing to the source repository URL

#### Scenario: Source link opens externally

- **WHEN** a user clicks the source code link in the auth shell footer
- **THEN** the link opens in a new browser tab (target="\_blank" with rel="noopener noreferrer")

### Requirement: AGPL notice in authenticated sidebar

The `Sidebar` component SHALL display an AGPL-3.0 license notice with a source link in the bottom meta area, alongside the existing version badge. The notice MUST be visible whenever the sidebar is visible (both desktop and mobile drawer).

#### Scenario: Notice visible in sidebar

- **WHEN** an authenticated user views the sidebar (desktop or mobile)
- **THEN** the bottom meta area displays the AGPL-3.0 notice and source link alongside the version badge

#### Scenario: Source link opens externally

- **WHEN** a user clicks the source code link in the sidebar
- **THEN** the link opens in a new browser tab (target="\_blank" with rel="noopener noreferrer")

### Requirement: Source URL configured via environment variable

The source repository URL SHALL be read from the `VITE_SOURCE_URL` Vite environment variable, declared as required in `ImportMetaEnv` in `vite-env.d.ts`, and documented in `.env.example`. `VITE_SOURCE_URL` is required — omitting it is a misconfiguration. This allows forks to point to their own repository without modifying source code.

#### Scenario: URL sourced from env var

- **WHEN** the AGPL notice is rendered in either `AuthShell` or `Sidebar`
- **THEN** the source link href is `import.meta.env.VITE_SOURCE_URL`

### Requirement: Notice text is translated

The human-readable label in the AGPL notice (e.g. "Source code") SHALL use the Lingui `<Trans>` macro so it is translated into all supported languages (Serbian, English, Russian).

#### Scenario: Label translated per locale

- **WHEN** the app locale is changed
- **THEN** the source link label in both notice locations reflects the translation for the active locale
