## MODIFIED Requirements

### Requirement: Service worker registration

The system SHALL register a service worker on app startup that precaches the app shell, emitted JavaScript chunks, and build/public static assets matched by the configured Workbox precache glob, including local text license files. Lazy signed-in shell and route chunks emitted by the production build SHALL remain covered by the existing precache configuration. The service worker SHALL exclude `/api/*` and `/__debug` routes from navigation fallback caching via `navigateFallbackDenylist`. The PWA configuration SHALL NOT maintain a separate explicit `includeAssets` list for public assets that are already matched by the precache glob.

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

### Requirement: Web manifest metadata

The system SHALL provide a web app manifest with AutoKPO-specific install metadata including name, short name, description, stable app identity, launch URL, scope, display mode, categories, and icons. The manifest SHALL NOT include static theme color, background color, language, or shortcut metadata.

#### Scenario: Browser reads manifest

- **WHEN** a browser requests the web app manifest
- **THEN** the manifest includes `name: AutoKPO`, `short_name: AutoKPO`, `description: AutoKPO helps manage KPO books`, `id`, `start_url`, `scope`, `display: standalone`, categories, and icon entries for 192x192 and 512x512 PNG assets

#### Scenario: Manifest avoids runtime-specific metadata

- **WHEN** a browser requests the web app manifest
- **THEN** the manifest does not include `theme_color`, `background_color`, `lang`, or `shortcuts`

## REMOVED Requirements

### Requirement: Runtime caching for font assets

**Reason**: AutoKPO uses local build/public font assets that are already included in the generated Workbox precache through the configured `woff2`, `ttf`, and `txt` glob patterns. Maintaining a separate `/fonts/*` CacheFirst runtime cache duplicates the precache and adds unnecessary service worker configuration.

**Migration**: Remove the font runtime caching rule and rely on the existing precache glob for local font files. Reintroduce targeted runtime caching only if a future change adds remote or otherwise non-precached font requests.
