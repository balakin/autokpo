## MODIFIED Requirements

### Requirement: Service worker registration

The system SHALL register a service worker on app startup that precaches the app shell, emitted JavaScript chunks, and static assets. Lazy signed-in shell and route chunks emitted by the production build SHALL remain covered by the existing precache configuration. The service worker SHALL exclude `/api/*` and `/__debug` routes from navigation fallback caching via `navigateFallbackDenylist`.

#### Scenario: Fresh visit loads and caches app shell

- **WHEN** a user visits the app for the first time
- **THEN** the service worker is registered and the app shell (HTML, JS, CSS, images) is precached

#### Scenario: Lazy chunks are precached

- **WHEN** the production build emits lazy JavaScript chunks for the signed-in shell or signed-in routes
- **THEN** those chunks SHALL match the service worker precache configuration

#### Scenario: Build reports precache coverage

- **WHEN** the app production build completes
- **THEN** the PWA output SHALL report a precache entry set that includes emitted JavaScript assets

#### Scenario: Subsequent visit works offline

- **WHEN** a user visits the app without network connectivity
- **THEN** the service worker serves the precached app shell and the app loads fully

#### Scenario: API routes bypass service worker fallback

- **WHEN** the service worker receives a navigation request for `/api/*` or `/__debug`
- **THEN** the request is not served from the navigation fallback cache and proceeds to the Cloudflare Worker instead
