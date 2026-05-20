## MODIFIED Requirements

### Requirement: Service worker registration

The system SHALL register a service worker on app startup that precaches the app shell, emitted JavaScript chunks, and build/public static assets matched by the configured Workbox precache glob, including local text license files. Lazy signed-in shell and route chunks emitted by the production build SHALL remain covered by the existing precache configuration. The service worker SHALL exclude `/api/*`, `/avatars/*`, and `/__debug` routes from navigation fallback caching via `navigateFallbackDenylist`. The PWA configuration SHALL NOT maintain a separate explicit `includeAssets` list for public assets that are already matched by the precache glob. The app SHALL use VitePWA's React virtual registration binding backed by `workbox-window` as its single service worker registration/update path.

#### Scenario: Fresh visit loads and caches app shell

- **WHEN** a user visits the app for the first time
- **THEN** the service worker is registered and the app shell (HTML, JS, CSS, images) is precached

#### Scenario: Lazy chunks are precached

- **WHEN** the production build emits lazy JavaScript chunks for the signed-in shell or signed-in routes
- **THEN** those chunks SHALL match the service worker precache configuration

#### Scenario: Build reports precache coverage

- **WHEN** the app production build completes
- **THEN** the PWA output SHALL report a precache entry set that includes emitted JavaScript assets and local text license files

#### Scenario: Subsequent visit works offline

- **WHEN** a user visits the app without network connectivity
- **THEN** the service worker serves the precached app shell and the app loads fully

#### Scenario: API and avatar routes bypass service worker fallback

- **WHEN** the service worker receives a navigation request for `/api/*`, `/avatars/*`, or `/__debug`
- **THEN** the request is not served from the navigation fallback cache and proceeds to the Cloudflare Worker instead

#### Scenario: Redundant public asset list is absent

- **WHEN** the PWA plugin configuration is evaluated
- **THEN** it does not define `includeAssets` for icons, fonts, or other public files already covered by the Workbox precache glob

#### Scenario: Single registration path

- **WHEN** the app starts in production mode
- **THEN** it registers the service worker through `virtual:pwa-register/react` without a parallel manual `navigator.serviceWorker.register('/sw.js')` path

## ADDED Requirements

### Requirement: Avatar images are cached for offline display

The service worker SHALL runtime-cache same-origin `/avatars/*` image responses so previously viewed profile images remain visible while offline.

#### Scenario: Viewed avatar remains available offline

- **WHEN** the app has successfully loaded a same-origin `/avatars/{randomUUID}` image while online
- **AND** the browser later loses network connectivity
- **THEN** the service worker SHALL be able to serve the cached avatar response for the same URL

#### Scenario: Avatar cache ignores failed responses

- **WHEN** a `/avatars/{randomUUID}` request returns a non-success response
- **THEN** the service worker SHALL NOT store that response as a reusable avatar image
