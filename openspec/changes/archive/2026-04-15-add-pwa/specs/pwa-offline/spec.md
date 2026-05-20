## ADDED Requirements

### Requirement: Service worker registration

The system SHALL register a service worker on app startup that precaches the app shell and static assets.

#### Scenario: Fresh visit loads and caches app shell

- **WHEN** a user visits the app for the first time
- **THEN** the service worker is registered and the app shell (HTML, JS, CSS, images) is precached

#### Scenario: Subsequent visit works offline

- **WHEN** a user visits the app without network connectivity
- **THEN** the service worker serves the precached app shell and the app loads fully

### Requirement: Runtime caching for font assets

The system SHALL use a CacheFirst runtime caching strategy with a 30-day expiration for font assets.

#### Scenario: Fonts cached on first load

- **WHEN** the app loads a font from a remote or local font origin
- **THEN** the font is cached with a CacheFirst strategy and reused from cache for 30 days

#### Scenario: Cached fonts served offline

- **WHEN** the app is offline and a cached font is requested
- **THEN** the font is served from the runtime cache

### Requirement: Web manifest metadata

The system SHALL provide a web app manifest with complete metadata including name, short name, description, theme color, background color, display mode, and icons.

#### Scenario: Browser reads manifest

- **WHEN** a browser requests the web app manifest
- **THEN** the manifest includes `name`, `short_name`, `description`, `start_url`, `display: standalone`, `theme_color`, `background_color`, and icon entries for 192x192 and 512x512

### Requirement: Offline status detection

The system SHALL detect and expose the online/offline status of the browser.

#### Scenario: App detects offline state

- **WHEN** the browser loses network connectivity
- **THEN** the system updates the online status to offline

#### Scenario: App detects online state

- **WHEN** the browser regains network connectivity
- **THEN** the system updates the online status to online

### Requirement: Offline indicator UI

The system SHALL display a visual indicator when the user is offline.

#### Scenario: Offline banner shown

- **WHEN** the app detects the browser is offline
- **THEN** an offline indicator banner is displayed to the user

#### Scenario: Offline banner hidden when online

- **WHEN** the app detects the browser is online
- **THEN** the offline indicator banner is not displayed
