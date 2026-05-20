## Why

KPO stores all user data in localStorage, making it inherently offline-capable — yet the app currently only works while online because there is no service worker to cache the shell. Users (Serbian taxpayers / accountants) may need to access their book of income and expenses in locations with poor or no connectivity. Converting to a PWA provides installability, offline access, and a native-like experience.

## What Changes

- Add a service worker (via `vite-plugin-pwa`) to precache the app shell and static assets
- Configure the service worker with a runtime caching strategy for font assets
- Enhance `site.webmanifest` with proper app metadata (name, description, theme colors, categories)
- Add offline indicator UI when the app detects no network connectivity
- Ensure `display: standalone` behavior works correctly (no browser chrome)
- Users install via browser's native install UI (address bar icon, browser menu)

## Capabilities

### New Capabilities

- `pwa-offline`: Service worker registration, offline caching strategies, and offline detection

### Modified Capabilities

<!-- No existing spec-level requirements change -->

## Impact

- **Dependencies**: Add `vite-plugin-pwa` as a dev dependency
- **Build config**: `vite.config.ts` updated with PWA plugin configuration
- **Public assets**: `site.webmanifest` enhanced with richer metadata
- **New components**: Offline indicator
- **Existing code**: `src/main.tsx` updated to register service worker
