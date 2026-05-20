## MODIFIED Requirements

### Requirement: Service worker registration

The system SHALL register a service worker on app startup that precaches the app shell, emitted JavaScript chunks, and build/public static assets matched by the configured Workbox precache glob, including local text license files. Lazy signed-in shell and route chunks emitted by the production build SHALL remain covered by the existing precache configuration. The service worker SHALL exclude `/api/*` and `/__debug` routes from navigation fallback caching via `navigateFallbackDenylist`. The PWA configuration SHALL NOT maintain a separate explicit `includeAssets` list for public assets that are already matched by the precache glob. The app SHALL use VitePWA's React virtual registration binding backed by `workbox-window` as its single service worker registration/update path.

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

#### Scenario: API routes bypass service worker fallback

- **WHEN** the service worker receives a navigation request for `/api/*` or `/__debug`
- **THEN** the request is not served from the navigation fallback cache and proceeds to the Cloudflare Worker instead

#### Scenario: Redundant public asset list is absent

- **WHEN** the PWA plugin configuration is evaluated
- **THEN** it does not define `includeAssets` for icons, fonts, or other public files already covered by the Workbox precache glob

#### Scenario: Single registration path

- **WHEN** the app starts in production mode
- **THEN** it registers the service worker through `virtual:pwa-register/react` without a parallel manual `navigator.serviceWorker.register('/sw.js')` path

### Requirement: Prompted app updates

The system SHALL detect when a new service worker version is available and prompt the user before activating it over active clients. The system SHALL NOT automatically reload pages or activate the waiting worker while users are actively running the current app version. After any tab explicitly accepts an update and the new service worker becomes the controller, all controlled AutoKPO tabs SHALL reload so the leader/follower tab set converges to the same app version.

#### Scenario: Update prompt is shown

- **WHEN** a new service worker finishes installing and is waiting to activate
- **THEN** the app displays a localized persistent prompt that a new version is available

#### Scenario: User defers update

- **WHEN** the update prompt is visible and the user chooses to defer or dismiss it
- **THEN** the current app version continues running without activating the waiting service worker

#### Scenario: User accepts update

- **WHEN** the update prompt is visible and the user chooses to reload
- **THEN** the app calls VitePWA's update function to activate the waiting service worker and reloads controlled AutoKPO tabs once the new service worker controls them

#### Scenario: Sibling tabs reload after accepted update

- **WHEN** one AutoKPO tab accepts a waiting service worker update
- **THEN** other controlled AutoKPO tabs reload after their service worker controller changes

#### Scenario: No surprise reload

- **WHEN** a new service worker is available while the user is using the app
- **THEN** the app does not reload automatically without explicit user action

### Requirement: Lazy chunk load recovery

The system SHALL provide a recovery path when a lazy-loaded route or app chunk fails to load in a way consistent with an app update or missing chunk.

#### Scenario: Chunk load fails

- **WHEN** a lazy route or signed-in app chunk fails to load due to a dynamic import or chunk loading error
- **THEN** the app shows a localized recovery message with an action to reload the page

#### Scenario: User reloads after chunk failure

- **WHEN** the chunk-load recovery message is visible and the user chooses to reload
- **THEN** the app reloads the page to fetch the currently available app version
