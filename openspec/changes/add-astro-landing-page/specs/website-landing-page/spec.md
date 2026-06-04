## ADDED Requirements

### Requirement: Public Astro landing page

The system SHALL provide a single-page public landing site for AutoKPO in the `apps/website` package using Astro components and plain CSS.

#### Scenario: Landing page renders

- **WHEN** a visitor opens the website root page
- **THEN** the system displays the AutoKPO landing page without requiring authentication

#### Scenario: No client UI framework required

- **WHEN** the website is built
- **THEN** the landing page implementation does not introduce React, React islands, or a UI kit for page sections

### Requirement: Serbian Latin product positioning

The landing page SHALL present AutoKPO in Serbian Latin as a free, open-source KPO tool for preduzetnici and paušalci.

#### Scenario: Hero communicates product purpose

- **WHEN** a visitor reads the hero section
- **THEN** the page explains that AutoKPO helps preduzetnici and paušalci manage KPO records and income tracking

#### Scenario: Free and open-source positioning is visible

- **WHEN** a visitor reviews the page
- **THEN** the page states that AutoKPO is free and open source

### Requirement: App and GitHub calls to action

The landing page SHALL provide `Otvori aplikaciju` as the primary call to action linking to `https://app.autokpo.com` and GitHub as a secondary action linking to `https://github.com/balakin/autokpo`.

#### Scenario: Primary CTA opens app

- **WHEN** a visitor activates the primary `Otvori aplikaciju` link
- **THEN** the link target is `https://app.autokpo.com`

#### Scenario: Secondary CTA opens GitHub

- **WHEN** a visitor activates the GitHub link
- **THEN** the link target is `https://github.com/balakin/autokpo`

### Requirement: App-aligned visual system

The landing page SHALL use a serious, app-aligned visual style based on the AutoKPO light/dark color schema, Manrope UI typography, JetBrains Mono for financial details, calm surfaces, and restrained ledger/dashboard details.

#### Scenario: Visual style matches app tone

- **WHEN** a visitor views the landing page
- **THEN** the page uses calm financial-dashboard styling rather than a generic SaaS template or unrelated visual theme

#### Scenario: Plain CSS provides reusable primitives

- **WHEN** implementers inspect the website styling
- **THEN** common landing primitives such as buttons, cards, badges, sections, screenshot frames, and FAQ items are styled through custom CSS

### Requirement: Light and dark theme support

The landing page SHALL support light and dark modes, default to system preference when no saved preference exists, and provide a visible accessible theme toggle.

#### Scenario: System preference is used by default

- **WHEN** a visitor has no saved website theme preference
- **THEN** the page uses the visitor's `prefers-color-scheme` value to select light or dark mode

#### Scenario: Visitor can toggle theme

- **WHEN** a visitor activates the theme toggle
- **THEN** the page changes between light and dark mode and persists the selection for future visits

### Requirement: Landing content sections

The landing page SHALL include header, hero, feature, dashboard screenshot, book-page preview, trust/security, FAQ, final CTA, and footer sections.

#### Scenario: Core sections are present

- **WHEN** a visitor scrolls through the landing page
- **THEN** the visitor can see the product introduction, feature overview, screenshot placeholders, trust/security messaging, FAQ, final CTA, and footer

#### Scenario: Navigation targets important sections

- **WHEN** a visitor uses the header navigation
- **THEN** navigation links move the visitor to important landing sections such as features, security/trust, and FAQ

### Requirement: Screenshot placeholders

The landing page SHALL include designed placeholders or image slots for dashboard and book-page screenshots, including light and dark variants for later replacement.

#### Scenario: Dashboard placeholder is visible

- **WHEN** actual dashboard screenshot assets are not yet available
- **THEN** the hero still displays a designed dashboard preview or placeholder without broken image UI

#### Scenario: Book page placeholder is visible

- **WHEN** actual book-page screenshot assets are not yet available
- **THEN** the book preview section still displays a designed book-page preview or placeholder without broken image UI

### Requirement: Accurate data and security FAQ copy

The landing page SHALL explain that AutoKPO requires an account, stores account/auth data needed for login, and stores KPO document content on the server only as encrypted synchronization data.

#### Scenario: Data storage distinction is clear

- **WHEN** a visitor reads the FAQ or trust/security section
- **THEN** the page distinguishes account/auth data, such as email and linked OAuth accounts, from encrypted KPO document data

#### Scenario: Server-readable KPO content is not claimed

- **WHEN** a visitor reads security copy
- **THEN** the page does not claim that all server-side data is absent or unreadable, and specifically limits unreadable-content claims to KPO document content

### Requirement: Non-official legal boundary

The landing page SHALL state that AutoKPO is a helper tool and not a legal, tax, bookkeeping, or official advisory service.

#### Scenario: Legal disclaimer is present

- **WHEN** a visitor reads the FAQ
- **THEN** the page states that AutoKPO is not a replacement for a bookkeeper, tax advisor, legal advisor, or competent institution

#### Scenario: Compliance guarantees are avoided

- **WHEN** a visitor reads the landing copy
- **THEN** the page does not guarantee legal, tax, or official correctness

### Requirement: Footer links and project metadata

The landing page SHALL include a footer with GitHub, AGPL-3.0 license, and open-source project notes.

#### Scenario: Footer exposes project source

- **WHEN** a visitor reaches the footer
- **THEN** the visitor can navigate to the AutoKPO GitHub repository

#### Scenario: Footer mentions license

- **WHEN** a visitor reaches the footer
- **THEN** the footer mentions AGPL-3.0 licensing
