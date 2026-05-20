## MODIFIED Requirements

### Requirement: AGPL notice in authenticated sidebar

The `Sidebar` component SHALL display a compact `AGPL-3.0 · [GitHub icon]` link in the bottom version footer, positioned to the right of the version badge. The link SHALL point to `VITE_SOURCE_URL`, open in a new tab, and render without underline decoration. The standalone AGPL text block and "Izvorni kod" labeled link that previously appeared as a separate section above the version badge are removed.

#### Scenario: Compact AGPL link visible in sidebar footer

- **WHEN** an authenticated user views the sidebar (desktop or mobile)
- **THEN** the version footer SHALL display the text "AGPL-3.0" and a GitHub icon as a single no-underline link to `VITE_SOURCE_URL`

#### Scenario: Source link opens externally

- **WHEN** a user clicks the AGPL-3.0 link in the sidebar footer
- **THEN** the link SHALL open in a new browser tab (`target="_blank"`, `rel="noopener noreferrer"`)
