## MODIFIED Requirements

### Requirement: Public Astro landing page

The system SHALL provide a single-page public landing site for AutoKPO in the `apps/website` package, implemented as an Astro page with native HTML sections, Astro icon components, inline global plain CSS, and minimal vanilla JavaScript for theme switching. The package SHALL include a `wrangler.jsonc` for deployment to Cloudflare Workers static asset hosting, with `wrangler` as a dev dependency.

#### Scenario: Landing page renders

- **WHEN** a visitor opens the website root page
- **THEN** the system displays the AutoKPO landing page without requiring authentication

#### Scenario: No client UI framework required

- **WHEN** the website is built
- **THEN** the landing page implementation does not introduce React, React islands, or a UI kit for page sections

#### Scenario: Website build checks Astro content

- **WHEN** the website build script runs
- **THEN** it performs `astro check --tsconfig tsconfig.app.json` before `astro build`

#### Scenario: wrangler.jsonc present for deployment

- **WHEN** a developer inspects `apps/website`
- **THEN** a `wrangler.jsonc` file exists configuring Cloudflare Workers static asset hosting pointing at `./dist`
