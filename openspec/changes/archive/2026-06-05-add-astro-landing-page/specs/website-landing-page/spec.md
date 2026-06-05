## ADDED Requirements

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

The landing page SHALL explain that AutoKPO requires an account, supports email/Google/GitHub sign-in, synchronizes data between devices, stores account/auth data needed for login separately, and presents synchronized application data as end-to-end encrypted.

#### Scenario: Data storage distinction is clear

- **WHEN** a visitor reads the FAQ data-storage answer
- **THEN** the page distinguishes account/auth data, such as email and linked Google/GitHub accounts, from encrypted KPO book data

#### Scenario: End-to-end encryption is described

- **WHEN** a visitor reads security copy
- **THEN** the page states that data is end-to-end encrypted, encryption/decryption happens on the user's device, and the server does not see the user's data in readable form

#### Scenario: Encryption primitives are named

- **WHEN** a visitor reads the FAQ answer about whether the server can read KPO data
- **THEN** the page names Argon2id for deriving the encryption key and AES-256-GCM for encrypting data

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

#### Scenario: Footer mentions project author

- **WHEN** a visitor reaches the footer
- **THEN** the footer includes a project author note linking to the author's GitHub profile

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
