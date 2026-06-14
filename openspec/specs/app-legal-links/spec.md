## Purpose

Provide locale-aware legal document URLs (Terms of Service, Privacy Policy) that resolve to `https://autokpo.com` routes based on the active app locale.

## Requirements

### Requirement: App legal links resolve from active locale

The system SHALL provide app-side legal document URLs for Terms of Service and Privacy Policy on the canonical public website origin `https://autokpo.com`. The URL mapping SHALL use the active app locale and SHALL resolve unsupported or missing locales to the English default routes.

The system SHALL map supported locales as follows:

- `en`: `https://autokpo.com/terms/`, `https://autokpo.com/privacy/`
- `sr-Latn`: `https://autokpo.com/sr-Latn/terms/`, `https://autokpo.com/sr-Latn/privacy/`
- `ru`: `https://autokpo.com/ru/terms/`, `https://autokpo.com/ru/privacy/`

#### Scenario: English resolves default legal routes

- **WHEN** the active app locale is `en`
- **THEN** legal links SHALL point to the non-prefixed `https://autokpo.com` Terms and Privacy routes

#### Scenario: Serbian Latin resolves prefixed legal routes

- **WHEN** the active app locale is `sr-Latn`
- **THEN** legal links SHALL point to the `/sr-Latn/terms/` and `/sr-Latn/privacy/` routes on `https://autokpo.com`

#### Scenario: Russian resolves prefixed legal routes

- **WHEN** the active app locale is `ru`
- **THEN** legal links SHALL point to the `/ru/terms/` and `/ru/privacy/` routes on `https://autokpo.com`

#### Scenario: Unknown locale falls back to English

- **WHEN** a legal URL is requested for an unsupported locale value
- **THEN** the system SHALL return the English default legal routes

### Requirement: App legal links open as external links

The system SHALL render app legal document links as external links that open in a new browser tab with `target="_blank"` and `rel="noopener noreferrer"`.

#### Scenario: Legal link opens safely in new tab

- **WHEN** a user activates an app legal document link
- **THEN** the link SHALL open the corresponding `https://autokpo.com` legal document in a new browser tab
- **AND** the link SHALL use `rel="noopener noreferrer"`
