## ADDED Requirements

### Requirement: Help page is accessible via /help route

The system SHALL render a `HelpPage` component at the `/help` route inside the signed-in application shell. The route SHALL be lazy-loaded following the same pattern as other signed-in routes. The breadcrumb for `/help` SHALL display the translated equivalent of "Pomoć".

#### Scenario: Navigating to /help renders the help page

- **WHEN** a signed-in user navigates to `/help`
- **THEN** the `HelpPage` SHALL render inside the AppShell content area

#### Scenario: Breadcrumb reflects help route

- **WHEN** the user is on the `/help` route
- **THEN** the top bar breadcrumb SHALL display the translated equivalent of "Pomoć"

---

### Requirement: Help page contains structured informational sections

The `HelpPage` component SHALL render the following sections in order, each with a heading and content. All text SHALL be wrapped with Lingui `<Trans>` or `t` macros. External links SHALL open in a new tab (`target="_blank"`, `rel="noopener noreferrer"`).

1. **O projektu** — A brief description of AutoKPO as a free, open-source app for maintaining the Knjiga o ostvarenom prometu (KPO), with local-first data storage and cross-device sync.
2. **Kako prijaviti problem** — Instructions to open a GitHub Issue, with a link to `https://github.com/balakin/autokpo/issues`.
3. **Zakonski propisi** — Two law links:
   - Zakon o porezu na dohodak građana: `https://mfin.gov.rs/sr/propisi-1/zakon-o-porezu-na-dohodak-gradjana-1` (čl. 42)
   - Zakon o porezu na dodatu vrednost: `https://purs.gov.rs/pravna-lica/pdv/zakon/202/zakon-o-porezu-na-dodatu-vrednost.html` (čl. 33)
4. **Doprinesite projektu** — An invitation to submit pull requests, with a link to the source repository (`import.meta.env.VITE_SOURCE_URL`).
5. **Autori** — "Prvobitno kreirao Dmitrii Balakin" with a link to `https://github.com/dm-balakin`, followed by a link to the contributors graph at `https://github.com/balakin/autokpo/graphs/contributors`.
6. **Licenca** — AGPL-3.0 notice with a link to the source repository (`import.meta.env.VITE_SOURCE_URL`).

#### Scenario: All sections are present

- **WHEN** a signed-in user views the `/help` page
- **THEN** the page SHALL display all six sections with their respective headings and content

#### Scenario: External links open in new tab

- **WHEN** the user clicks any external link on the help page
- **THEN** the link SHALL open in a new browser tab

#### Scenario: Law links use correct URLs

- **WHEN** the user views the "Zakonski propisi" section
- **THEN** it SHALL contain a link to `https://mfin.gov.rs/sr/propisi-1/zakon-o-porezu-na-dohodak-gradjana-1`
- **AND** a link to `https://purs.gov.rs/pravna-lica/pdv/zakon/202/zakon-o-porezu-na-dodatu-vrednost.html`

#### Scenario: Author attribution is present

- **WHEN** the user views the "Autori" section
- **THEN** a link to `https://github.com/dm-balakin` SHALL be present
- **AND** a link to `https://github.com/balakin/autokpo/graphs/contributors` SHALL be present

#### Scenario: All strings are translatable

- **WHEN** the app locale is changed
- **THEN** all help page headings and body text SHALL reflect the active locale's translations
