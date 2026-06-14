## Purpose

Bridge that passes the website's active locale to the app via a `?lang=` query parameter on "Open App" links, allowing the app to pre-select the correct locale on first visit.

## Requirements

### Requirement: Website passes locale to app via query parameter

The system SHALL append a `?lang=<locale>` query parameter to all "Open App" links on the marketing website, where `<locale>` matches the current page's locale code (`sr-Latn`, `en`, or `ru`).

#### Scenario: English page links to app with en param

- **WHEN** a visitor views the English website at `/`
- **THEN** all "Open App" links SHALL point to `https://app.autokpo.com?lang=en`

#### Scenario: Russian page links to app with ru param

- **WHEN** a visitor views the Russian website at `/ru/`
- **THEN** all "Open App" links SHALL point to `https://app.autokpo.com?lang=ru`

#### Scenario: Serbian page links to app with sr-Latn param

- **WHEN** a visitor views the Serbian Latin website at `/sr-Latn/`
- **THEN** all "Open App" links SHALL point to `https://app.autokpo.com?lang=sr-Latn`

#### Scenario: Header button carries locale

- **WHEN** any website page renders the site header
- **THEN** the header's "Open App" button SHALL include the `?lang=` parameter matching the current page locale

#### Scenario: Hero and final CTA buttons carry locale

- **WHEN** a landing page renders
- **THEN** both the hero section and final section "Open App" buttons SHALL include the `?lang=` parameter matching the page locale
