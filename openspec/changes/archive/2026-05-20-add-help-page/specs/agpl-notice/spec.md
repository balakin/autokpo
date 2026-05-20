## MODIFIED Requirements

### Requirement: AGPL notice in authenticated sidebar

The `Sidebar` component SHALL display a compact `AGPL-3.0 · [GitHub icon]` link in the bottom version footer, positioned to the right of the version badge. The link SHALL point to `https://github.com/balakin/autokpo`, open in a new tab, and render without underline decoration. The standalone AGPL text block and "Izvorni kod" labeled link that previously appeared as a separate section above the version badge are removed.

#### Scenario: Compact AGPL link visible in sidebar footer

- **WHEN** an authenticated user views the sidebar (desktop or mobile)
- **THEN** the version footer SHALL display the text "AGPL-3.0" and a GitHub icon as a single no-underline link to `https://github.com/balakin/autokpo`

#### Scenario: Source link opens externally

- **WHEN** a user clicks the AGPL-3.0 link in the sidebar footer
- **THEN** the link SHALL open in a new browser tab (`target="_blank"`, `rel="noopener noreferrer"`)

## REMOVED Requirements

### Requirement: Source URL configured via environment variable

**Reason**: The source repository URL is now hardcoded to `https://github.com/balakin/autokpo` across all components (sidebar, help page). The `VITE_SOURCE_URL` env var, its `ImportMetaEnv` declaration, and its `.env.example` entry are removed. Forks wishing to point to a different URL should modify the constants in source directly.

**Migration**: Remove `VITE_SOURCE_URL` from `.env`, `.env.example`, and `vite-env.d.ts`. Replace all `import.meta.env.VITE_SOURCE_URL` references with the hardcoded URL constant.
