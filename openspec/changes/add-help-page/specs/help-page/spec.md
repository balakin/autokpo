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

The `HelpPage` component SHALL render six sections using HeroUI `Card` components, matching the card-based composition pattern used in the rest of the application. All text SHALL be wrapped with Lingui `<Trans>` or `t` macros. External links SHALL open in a new tab (`target="_blank"`, `rel="noopener noreferrer"`). The page container SHALL use `p-4 lg:p-6` with `gap-4 lg:gap-6`, consistent with dashboard and settings pages.

Layout:

- **Row 1** — single full-width card: "O projektu"
- **Row 2** — 2-column grid (`sm:grid-cols-2`): "Kako prijaviti problem" + "Zakonski propisi"
- **Row 3** — 3-column grid (`sm:grid-cols-3`): "Doprinesite projektu" + "Autori" + "Licenca"

Each card uses `Card.Header` with a Lucide icon and `Card.Title`, and `Card.Content` for body content.

Section content:

1. **O projektu** (icon: `LuInfo`) — Brief description of AutoKPO as a free open-source app for maintaining the Knjiga o ostvarenom prometu (KPO), with local-first data storage and cross-device sync.
2. **Kako prijaviti problem** (icon: `LuBug`) — Instructions to open a GitHub Issue, with a link to `https://github.com/balakin/autokpo/issues`.
3. **Zakonski propisi** (icon: `LuScale`) — Two law links, each with an article reference subtitle below:
   - Zakon o porezu na dohodak građana: `https://mfin.gov.rs/sr/propisi-1/zakon-o-porezu-na-dohodak-gradjana-1` / subtitle: "čl. 42 — godišnji limit"
   - Zakon o porezu na dodatu vrednost: `https://purs.gov.rs/pravna-lica/pdv/zakon/202/zakon-o-porezu-na-dodatu-vrednost.html` / subtitle: "čl. 33 — rolling 12 meseci"
4. **Doprinesite projektu** (icon: `LuGitPullRequest`) — Invitation to submit pull requests, with a link to `VITE_SOURCE_URL`.
5. **Autori** (icon: `LuUsers`) — Two list items:
   - "Dmitrii Balakin" link to `https://github.com/dm-balakin` with subtitle "Osnivač projekta"
   - "Svi doprinosioci" link to `https://github.com/balakin/autokpo/graphs/contributors` (no subtitle)
6. **Licenca** (icon: `LuShield`) — One list item: "AGPL-3.0" link to `VITE_SOURCE_URL` with subtitle "GNU Affero General Public License v3.0"

#### Scenario: All sections are present

- **WHEN** a signed-in user views the `/help` page
- **THEN** the page SHALL display all six card sections with their respective headings

#### Scenario: External links open in new tab

- **WHEN** the user clicks any external link on the help page
- **THEN** the link SHALL open in a new browser tab

#### Scenario: Law links use correct URLs with subtitles

- **WHEN** the user views the "Zakonski propisi" card
- **THEN** it SHALL contain a link to `https://mfin.gov.rs/sr/propisi-1/zakon-o-porezu-na-dohodak-gradjana-1`
- **AND** a link to `https://purs.gov.rs/pravna-lica/pdv/zakon/202/zakon-o-porezu-na-dodatu-vrednost.html`
- **AND** each link SHALL have an article reference subtitle below it

#### Scenario: Author attribution uses list pattern

- **WHEN** the user views the "Autori" card
- **THEN** a link to `https://github.com/dm-balakin` SHALL be present with subtitle "Osnivač projekta"
- **AND** a link to `https://github.com/balakin/autokpo/graphs/contributors` SHALL be present without a subtitle

#### Scenario: License card uses list pattern

- **WHEN** the user views the "Licenca" card
- **THEN** an "AGPL-3.0" link to `VITE_SOURCE_URL` SHALL be present
- **AND** the subtitle "GNU Affero General Public License v3.0" SHALL appear below the link

#### Scenario: All strings are translatable

- **WHEN** the app locale is changed
- **THEN** all help page headings and body text SHALL reflect the active locale's translations
