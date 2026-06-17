## MODIFIED Requirements

### Requirement: Help page contains structured informational sections

The `HelpPage` component SHALL render seven sections using HeroUI `Card` components, matching the card-based composition pattern used in the rest of the application. All text SHALL be wrapped with Lingui `<Trans>` or `t` macros. External links SHALL open in a new tab (`target="_blank"`, `rel="noopener noreferrer"`). The page container SHALL use `p-4 lg:p-6` with `gap-4 lg:gap-6`, consistent with dashboard and settings pages. Product-description text SHALL use KPO record-keeping terminology and avoid awkward literal English/Russian translations of `Knjiga o ostvarenom prometu`.

Layout:

- **Row 1** — single full-width card: "O projektu"
- **Row 2** — 2-column grid (`sm:grid-cols-2`): "Kako prijaviti problem" + "Zakonski propisi"
- **Row 3** — 2-column grid (`sm:grid-cols-2`): "Doprinesite projektu" + "Autori"
- **Row 4** — 2-column grid (`sm:grid-cols-2`): "Licenca" + "Šifrovanje"

Each card uses `Card.Header` with a Lucide icon and `Card.Title`, and `Card.Content` for body content.

Section content:

1. **O projektu** (icon: `LuInfo`) — Brief description of AutoKPO as a free open-source app for KPO record-keeping, with local-first data storage and cross-device sync.
2. **Kako prijaviti problem** (icon: `LuBug`) — Instructions to open a GitHub Issue, with a link to `https://github.com/balakin/autokpo/issues`. Below the GitHub link, a `mailto:support@autokpo.com` link SHALL be present as a second contact option.
3. **Zakonski propisi** (icon: `LuScale`) — Two law links, each with an article reference subtitle below:
   - Zakon o porezu na dohodak građana: `https://mfin.gov.rs/sr/propisi-1/zakon-o-porezu-na-dohodak-gradjana-1` / subtitle: "čl. 42 — godišnji limit"
   - Zakon o porezu na dodatu vrednost: `https://purs.gov.rs/pravna-lica/pdv/zakon/202/zakon-o-porezu-na-dodatu-vrednost.html` / subtitle: "čl. 33 — rolling 12 meseci"
4. **Doprinesite projektu** (icon: `LuGitPullRequest`) — Invitation to submit pull requests, with a link to `https://github.com/balakin/autokpo`.
5. **Autori** (icon: `LuUsers`) — Two list items:
   - "Dmitrii Balakin" link to `https://github.com/dm-balakin` with subtitle "Osnivač projekta"
   - "Svi doprinosioci" link to `https://github.com/balakin/autokpo/graphs/contributors` (no subtitle)
6. **Licenca** (icon: `LuShield`) — One list item: "AGPL-3.0" link to `https://github.com/balakin/autokpo/blob/main/LICENSE` with subtitle "GNU Affero General Public License v3.0"
7. **Šifrovanje** (icon: `LuKeyRound`) — Description of the end-to-end encryption implementation. The body text SHALL name the Argon2id key derivation algorithm and AES-256-GCM encryption algorithm. The text SHALL state that the server never sees user data in readable form (zero-knowledge property). The card SHALL NOT contain external links.

#### Scenario: All sections are present

- **WHEN** a signed-in user views the `/help` page
- **THEN** the page SHALL display all seven card sections with their respective headings

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
- **THEN** an "AGPL-3.0" link to `https://github.com/balakin/autokpo/blob/main/LICENSE` SHALL be present
- **AND** the subtitle "GNU Affero General Public License v3.0" SHALL appear below the link

#### Scenario: Encryption card describes algorithms and zero-knowledge property

- **WHEN** the user views the "Šifrovanje" card
- **THEN** the card heading SHALL be the translated equivalent of "Šifrovanje"
- **AND** the body text SHALL mention Argon2id and AES-256-GCM
- **AND** the body text SHALL state that the server does not see user data in readable form
- **AND** the card SHALL use the `LuKeyRound` icon

#### Scenario: All strings are translatable

- **WHEN** the app locale is changed
- **THEN** all help page headings and body text SHALL reflect the active locale's translations

#### Scenario: Report-problem card contains support email link

- **WHEN** the user views the "Kako prijaviti problem" card
- **THEN** a `mailto:support@autokpo.com` link SHALL be present below the GitHub Issues link
- **AND** the link label SHALL be the translated equivalent of "Pišite nam na support@autokpo.com"
- **AND** the link SHALL open in a new tab

#### Scenario: About section uses KPO record-keeping wording

- **WHEN** the user views the "O projektu" card in English or Russian
- **THEN** the body text SHALL describe AutoKPO as an app for KPO record-keeping
- **AND** it SHALL avoid using a literal translation of `Knjiga o ostvarenom prometu` as the primary product phrase
