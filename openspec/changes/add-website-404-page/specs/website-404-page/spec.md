## ADDED Requirements

### Requirement: Custom 404 page

The system SHALL provide a custom 404 page at `src/pages/404.astro` in `apps/website` that is visually consistent with the rest of the site and helps visitors navigate back to a valid page.

#### Scenario: Unmatched URL serves custom 404

- **WHEN** a visitor navigates to any URL on `autokpo.com` that does not match a known page
- **THEN** the system serves the custom `404.html` page with the site's visual styling

#### Scenario: 404 page contains navigation links to all locale homepages

- **WHEN** a visitor views the 404 page
- **THEN** the page displays links to `/` (sr-Latn), `/en/` (English), and `/ru/` (Russian) homepages

#### Scenario: 404 page uses base layout

- **WHEN** the 404 page is rendered
- **THEN** it uses `base-layout.astro` with correct `<html lang>`, `<title>`, and meta `description` attributes

#### Scenario: Build outputs 404.html

- **WHEN** `astro build` runs in `apps/website`
- **THEN** `dist/404.html` exists in the build output

### Requirement: Wrangler configuration for static asset hosting

The system SHALL include a `wrangler.jsonc` in `apps/website` that configures Cloudflare Workers static asset hosting with a custom 404 handler.

#### Scenario: Unmatched routes are handled by custom 404 page

- **WHEN** a request matches no static asset in the `dist/` directory
- **THEN** Cloudflare Workers serves `dist/404.html` (configured via `not_found_handling: "404-page"`)

#### Scenario: wrangler.jsonc names the worker correctly

- **WHEN** the `wrangler.jsonc` is read
- **THEN** the `name` field is `"autokpo-website"` and `assets.directory` is `"./dist"`
