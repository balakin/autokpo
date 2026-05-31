## ADDED Requirements

### Requirement: Protected API runtime caches are explicit

The PWA service worker SHALL define runtime caches only for protected API GET endpoints whose offline semantics are intentional. The protected runtime caches SHALL be separate from the app-shell precache and SHALL NOT change the navigation fallback denylist for `/api/*` routes.

#### Scenario: Protected API runtime caches do not provide navigation fallback

- **WHEN** the service worker receives a navigation request for `/api/*`
- **THEN** the request SHALL still be excluded from navigation fallback caching
- **AND** protected API runtime caching SHALL apply only to matching non-navigation GET requests

#### Scenario: Sync endpoint is not runtime-cached

- **WHEN** the service worker receives a request for `/api/sync`
- **THEN** the service worker SHALL NOT serve the response from a runtime API cache

## REMOVED Requirements

### Requirement: Avatar images are cached for offline display

**Reason**: Same-origin avatar runtime caching is deprecated and no longer part of the offline data model.

**Migration**: Remove the Workbox `/avatars/*` CacheFirst runtime cache and stop clearing the obsolete `avatars` cache during logout. No user migration is required.
