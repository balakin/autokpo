## MODIFIED Requirements

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

The landing page SHALL include a localized footer on every supported locale page with GitHub, AGPL-3.0 license, and open-source project notes.

#### Scenario: Footer exposes project source

- **WHEN** a visitor reaches the footer on any localized landing page
- **THEN** the visitor can navigate to the AutoKPO GitHub repository

#### Scenario: Footer mentions license

- **WHEN** a visitor reaches the footer on any localized landing page
- **THEN** the footer mentions AGPL-3.0 licensing in that page's locale

#### Scenario: Footer mentions project author

- **WHEN** a visitor reaches the footer on any localized landing page
- **THEN** the footer includes a project author note linking to the author's GitHub profile in that page's locale
