## MODIFIED Requirements

### Requirement: App legal links resolve from active locale

The system SHALL provide app-side legal document URLs for Terms of Service and Privacy Policy on the canonical public website origin `https://autokpo.com`. The URL mapping SHALL use the active app locale and SHALL resolve unsupported or missing locales to the Serbian Latin default routes.

The system SHALL map supported locales as follows:

- `sr-Latn`: `https://autokpo.com/terms/`, `https://autokpo.com/privacy/`
- `en`: `https://autokpo.com/en/terms/`, `https://autokpo.com/en/privacy/`
- `ru`: `https://autokpo.com/ru/terms/`, `https://autokpo.com/ru/privacy/`

#### Scenario: Serbian Latin resolves default legal routes

- **WHEN** the active app locale is `sr-Latn`
- **THEN** legal links SHALL point to the non-prefixed `https://autokpo.com` Terms and Privacy routes

#### Scenario: English resolves prefixed legal routes

- **WHEN** the active app locale is `en`
- **THEN** legal links SHALL point to the `/en/terms/` and `/en/privacy/` routes on `https://autokpo.com`

#### Scenario: Russian resolves prefixed legal routes

- **WHEN** the active app locale is `ru`
- **THEN** legal links SHALL point to the `/ru/terms/` and `/ru/privacy/` routes on `https://autokpo.com`

#### Scenario: Unknown locale falls back to Serbian Latin

- **WHEN** a legal URL is requested for an unsupported locale value
- **THEN** the system SHALL return the Serbian Latin default legal routes

## REMOVED Requirements

### Requirement: Cookies Policy app link

**Reason**: Cookies Policy page removed from the website; the app no longer needs to link to it.
**Migration**: Remove `cookies` property from `LegalDocument` type and all callsites. Update any test that asserts on a `cookies` URL.
