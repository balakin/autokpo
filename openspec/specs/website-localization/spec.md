# website-localization Specification

## Purpose

TBD - created by archiving change localize-website. Update Purpose after archive.

## Requirements

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

### Requirement: Localized landing content

The system SHALL localize the landing page's visible content, metadata, navigation, calls to action, FAQ content, footer copy, and accessibility labels for each supported locale.

#### Scenario: English content is localized

- **WHEN** a visitor views `/en/`
- **THEN** product positioning, section headings, body copy, FAQ answers, CTA labels, footer text, and relevant accessibility labels are presented in English

#### Scenario: Russian content is localized

- **WHEN** a visitor views `/ru/`
- **THEN** product positioning, section headings, body copy, FAQ answers, CTA labels, footer text, and relevant accessibility labels are presented in Russian

#### Scenario: Serbian Latin content remains available

- **WHEN** a visitor views `/`
- **THEN** the landing page preserves Serbian Latin product, security, legal-disclaimer, open-source, and CTA messaging

### Requirement: Language switcher

The system SHALL provide a visible language switcher that lets visitors navigate between all supported localized landing pages.

#### Scenario: Visitor switches to English

- **WHEN** a visitor activates the English language link
- **THEN** the browser navigates to `/en/`

#### Scenario: Visitor switches to Russian

- **WHEN** a visitor activates the Russian language link
- **THEN** the browser navigates to `/ru/`

#### Scenario: Visitor switches to Serbian Latin

- **WHEN** a visitor activates the Serbian Latin language link
- **THEN** the browser navigates to `/`

#### Scenario: Current language is indicated

- **WHEN** a visitor views any supported localized landing page
- **THEN** the language switcher indicates the current locale accessibly

### Requirement: Locale-aware SEO metadata

The system SHALL render locale-aware document language, title, description, canonical URL, and alternate-language links for each localized landing page.

#### Scenario: Document language matches locale

- **WHEN** a localized landing page is rendered
- **THEN** the page's `html` `lang` attribute matches the page locale

#### Scenario: Canonical URL matches locale route

- **WHEN** a localized landing page head is rendered
- **THEN** the canonical URL points to that locale's canonical route

#### Scenario: Alternate language links are available

- **WHEN** a localized landing page head is rendered
- **THEN** the page exposes `hreflang` alternates for Serbian Latin, English, and Russian routes

### Requirement: Static localization boundaries

The system SHALL keep localization compatible with static Astro output and SHALL NOT require server-side locale detection or a custom Astro server.

#### Scenario: Root page does not auto-detect browser language

- **WHEN** a visitor opens `/` with any browser language preference
- **THEN** the system displays Serbian Latin content rather than redirecting based on `Accept-Language`

#### Scenario: Server output is not required

- **WHEN** implementers inspect the website Astro configuration
- **THEN** the configuration does not require `output: "server"` for localized website routing
