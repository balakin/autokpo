# website-legal-documents Specification

## Purpose

Provide public static legal document pages (Privacy Policy, Terms of Service) for every supported website locale, rendered from Markdown at build time with a shared website-aligned layout.

## Requirements

### Requirement: Localized legal document pages

The system SHALL provide public static legal document pages for Privacy Policy and Terms of Service in every supported website locale.

#### Scenario: Serbian Latin legal documents render

- **WHEN** a visitor opens `/privacy/` or `/terms/`
- **THEN** the system displays the corresponding Serbian Latin legal document page without requiring authentication

#### Scenario: English legal documents render

- **WHEN** a visitor opens `/en/privacy/` or `/en/terms/`
- **THEN** the system displays the corresponding English legal document page without requiring authentication

#### Scenario: Russian legal documents render

- **WHEN** a visitor opens `/ru/privacy/` or `/ru/terms/`
- **THEN** the system displays the corresponding Russian legal document page without requiring authentication

### Requirement: English legal document slugs

The system SHALL use English URL slugs for legal document pages across all locales.

#### Scenario: Default locale uses English slugs

- **WHEN** Serbian Latin legal document routes are generated
- **THEN** the routes use `/privacy/` and `/terms/`

#### Scenario: Prefixed locales use English slugs

- **WHEN** English or Russian legal document routes are generated
- **THEN** the routes use the locale prefix followed by `/privacy/` or `/terms/`

### Requirement: Markdown-rendered legal content

The system SHALL author legal document bodies as Markdown and render them to static HTML during the Astro website build.

#### Scenario: Legal document content is rendered from Markdown

- **WHEN** the website production build runs
- **THEN** each legal document page is generated from Markdown content rather than a browser-side Markdown renderer

#### Scenario: Placeholder content is used for current iteration

- **WHEN** a visitor views any legal document page in this iteration
- **THEN** the document body contains localized lorem ipsum placeholder content rather than final legal policy text

### Requirement: Legal document page shell

The system SHALL render legal documents with a shared website-aligned page shell including metadata, local fonts, favicons, light/dark theme support, header affordances, document content styling, and footer links.

#### Scenario: Legal page metadata is localized

- **WHEN** a legal document page head is rendered
- **THEN** the page title, description, canonical URL, and document language match the document locale and route

#### Scenario: Legal page theme can be toggled

- **WHEN** a visitor activates the theme toggle on a legal document page
- **THEN** the page changes between light and dark mode and persists the selection under `autokpo-theme`

#### Scenario: Markdown content is readable

- **WHEN** a visitor reads a legal document page
- **THEN** Markdown-generated headings, paragraphs, lists, links, tables, blockquotes, and code blocks are styled consistently with the website visual system

### Requirement: Legal document cross-links

The system SHALL provide convenient localized links to Privacy Policy and Terms of Service from public website footers.

#### Scenario: Landing footer links legal documents

- **WHEN** a visitor reaches the footer on any localized landing page
- **THEN** the footer exposes links to that locale's Privacy Policy and Terms of Service pages

#### Scenario: Legal footer links legal documents

- **WHEN** a visitor reaches the footer on any localized legal document page
- **THEN** the footer exposes links to that locale's Privacy Policy and Terms of Service pages
