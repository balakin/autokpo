## Purpose

Provide the public AutoKPO landing website at `autokpo.com`, introducing the product to Serbian Latin-speaking preduzetnici and paušalci before they open the authenticated app.

## Requirements

### Requirement: Public Astro landing page

The system SHALL provide a single-page public landing site for AutoKPO in the `apps/website` package, implemented as an Astro page with native HTML sections, Astro icon components, inline global plain CSS, and minimal vanilla JavaScript for theme switching.

#### Scenario: Landing page renders

- **WHEN** a visitor opens the website root page
- **THEN** the system displays the AutoKPO landing page without requiring authentication

#### Scenario: No client UI framework required

- **WHEN** the website is built
- **THEN** the landing page implementation does not introduce React, React islands, or a UI kit for page sections

#### Scenario: Website build checks Astro content

- **WHEN** the website build script runs
- **THEN** it performs `astro check --tsconfig tsconfig.app.json` before `astro build`

### Requirement: Serbian Latin product positioning

The landing page SHALL present AutoKPO in Serbian Latin at the website root as a free, open-source KPO tool for preduzetnici and paušalci, while localized English and Russian landing pages SHALL present equivalent product positioning for their respective audiences.

#### Scenario: Hero communicates product purpose

- **WHEN** a visitor reads the hero section on any localized landing page
- **THEN** the page explains that AutoKPO helps preduzetnici and paušalci manage KPO records and income tracking in that page's locale

#### Scenario: Free and open-source positioning is visible

- **WHEN** a visitor reviews any localized landing page
- **THEN** the page states in that page's locale that AutoKPO is free and open source

### Requirement: App and GitHub calls to action

The landing page SHALL provide a localized primary call to action linking to `https://app.autokpo.com` and a localized GitHub secondary action linking to `https://github.com/balakin/autokpo` on every supported locale page.

#### Scenario: Primary CTA opens app

- **WHEN** a visitor activates the primary app call-to-action link on any localized landing page
- **THEN** the link target is `https://app.autokpo.com`

#### Scenario: Secondary CTA opens GitHub

- **WHEN** a visitor activates the GitHub link on any localized landing page
- **THEN** the link target is `https://github.com/balakin/autokpo`

### Requirement: App-aligned visual system

The landing page SHALL use a serious, app-aligned visual style based on the AutoKPO light/dark color schema, OKLCH CSS variables, local Manrope UI typography, local JetBrains Mono for financial details, calm surfaces, and restrained ledger details.

#### Scenario: Visual style matches app tone

- **WHEN** a visitor views the landing page
- **THEN** the page uses calm financial-dashboard styling, including a decorative KPO ledger mockup, rather than a generic SaaS template or unrelated visual theme

#### Scenario: Plain CSS provides reusable primitives

- **WHEN** implementers inspect the website styling
- **THEN** common landing primitives such as buttons, cards, sections, the ledger mockup, and FAQ items are styled through custom CSS

### Requirement: Light and dark theme support

The landing page SHALL support light and dark modes, default to system preference when no saved preference exists, and provide a visible accessible theme toggle that persists preference under `autokpo-theme`.

#### Scenario: System preference is used by default

- **WHEN** a visitor has no saved website theme preference
- **THEN** the page uses the visitor's `prefers-color-scheme` value to select light or dark mode

#### Scenario: Visitor can toggle theme

- **WHEN** a visitor activates the theme toggle
- **THEN** the page changes between light and dark mode, updates the document `data-theme` and `.dark` class, updates the toggle accessibility state, and persists the selection for future visits

### Requirement: Landing content sections

The landing page SHALL include sticky header navigation, hero, feature grid, trust/security, FAQ accordion, final CTA, and footer sections.

#### Scenario: Core sections are present

- **WHEN** a visitor scrolls through the landing page
- **THEN** the visitor can see the product introduction with a ledger mockup, feature overview, trust/security messaging, FAQ, final CTA, and footer

#### Scenario: Navigation targets important sections

- **WHEN** a visitor uses the header navigation
- **THEN** navigation links move the visitor to important landing sections such as features, security/trust, and FAQ

### Requirement: Data and security copy

The landing page SHALL explain in each supported locale that AutoKPO requires an account, supports email/Google/GitHub sign-in, synchronizes data between devices, stores account/auth data needed for login separately, and presents synchronized application data as end-to-end encrypted.

#### Scenario: Data storage distinction is clear

- **WHEN** a visitor reads the FAQ data-storage answer on any localized landing page
- **THEN** the page distinguishes account/auth data, such as email and linked Google/GitHub accounts, from encrypted KPO book data in that page's locale

#### Scenario: End-to-end encryption is described

- **WHEN** a visitor reads security copy on any localized landing page
- **THEN** the page states in that page's locale that data is end-to-end encrypted, encryption/decryption happens on the user's device, and the server does not see the user's data in readable form

#### Scenario: Encryption primitives are named

- **WHEN** a visitor reads the FAQ answer about whether the server can read KPO data on any localized landing page
- **THEN** the page names Argon2id for deriving the encryption key and AES-256-GCM for encrypting data

### Requirement: Non-official legal boundary

The landing page SHALL state in each supported locale that AutoKPO is a helper tool and not a legal, tax, bookkeeping, or official advisory service.

#### Scenario: Legal disclaimer is present

- **WHEN** a visitor reads the FAQ on any localized landing page
- **THEN** the page states in that page's locale that AutoKPO is not a replacement for a bookkeeper, tax advisor, legal advisor, or competent institution

#### Scenario: Compliance guarantees are avoided

- **WHEN** a visitor reads the landing copy on any localized landing page
- **THEN** the page does not guarantee legal, tax, or official correctness

### Requirement: Footer links and project metadata

The landing page SHALL include a localized footer on every supported locale page with GitHub, Cookies Policy, Privacy Policy, Terms of Service, AGPL-3.0 license, open-source project notes, and a support email link.

#### Scenario: Footer exposes project source

- **WHEN** a visitor reaches the footer on any localized landing page
- **THEN** the visitor can navigate to the AutoKPO GitHub repository

#### Scenario: Footer links legal documents

- **WHEN** a visitor reaches the footer on any localized landing page
- **THEN** the visitor can navigate to that locale's Cookies Policy, Privacy Policy, and Terms of Service pages

#### Scenario: Footer mentions license

- **WHEN** a visitor reaches the footer on any localized landing page
- **THEN** the footer mentions AGPL-3.0 licensing in that page's locale

#### Scenario: Footer mentions project author

- **WHEN** a visitor reaches the footer on any localized landing page
- **THEN** the footer includes a project author note linking to the author's GitHub profile in that page's locale

#### Scenario: Footer contains support email link

- **WHEN** a visitor reaches the footer on any localized landing page
- **THEN** the footer SHALL contain a `mailto:support@autokpo.com` link in the legal-links row
- **AND** the link label SHALL be the localized equivalent of "support@autokpo.com" in that page's locale

### Requirement: Landing assets

The landing page SHALL include local font assets, favicon assets, and theme-aware GitHub icon assets.

#### Scenario: Local fonts load

- **WHEN** the landing page renders
- **THEN** Manrope and JetBrains Mono are loaded from local website font files

#### Scenario: Favicons are available

- **WHEN** the landing page head is rendered
- **THEN** it links PNG, SVG, and ICO favicon assets

#### Scenario: GitHub icon adapts to theme

- **WHEN** the visitor switches between light and dark themes
- **THEN** GitHub links use the appropriate black or white local GitHub SVG icon
