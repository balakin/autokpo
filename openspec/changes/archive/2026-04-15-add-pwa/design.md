## Context

KPO is a fully client-side React app that persists all data to localStorage. It already ships a `site.webmanifest` and icon assets in `public/`, and `index.html` links the manifest — so basic installability metadata exists. However, there is no service worker, meaning the app cannot work offline and does not meet the PWA installability criteria enforced by browsers (Chrome requires a service worker with a `fetch` handler).

## Goals / Non-Goals

**Goals:**

- Make KPO installable on desktop and mobile browsers
- Enable full offline functionality — app shell loads without network
- Provide a runtime caching strategy for font assets
- Surface offline status to the user via UI

**Non-Goals:**

- Background sync or periodic background fetch (no server to sync with)
- Push notifications
- Service worker updates UI (beyond the default browser behavior for reload)
- Caching API responses (there is no API)

## Decisions

### 1. Use `vite-plugin-pwa` with Workbox

**Choice**: `vite-plugin-pwa` (which wraps Workbox) integrated into the Vite build.

**Alternatives considered**:

- **Custom service worker**: Full control but significant maintenance burden, easy to introduce caching bugs
- **`@vite-pwa/assets-generator`**: Only handles icon generation, not service worker lifecycle

**Rationale**: `vite-plugin-pwa` is the standard solution for Vite-based PWAs. It generates a service worker at build time, handles precache manifest injection, and provides configurable caching strategies. Zero custom service worker code needed.

### 2. Precache strategy: `generateSW` (not `injectManifest`)

**Choice**: Use `generateSW` mode — Workbox auto-generates the service worker from the Vite build output.

**Rationale**: KPO has no custom service worker logic (no push, no background sync). `generateSW` is simpler and sufficient. If custom fetch handling is needed later, we can switch to `injectManifest`.

### 3. Runtime caching for fonts

**Choice**: CacheFirst strategy with a 30-day expiration for font origins (`fonts.gstatic.com`, local fonts in `public/fonts/`).

**Rationale**: Fonts are immutable once loaded and rarely change. CacheFirst avoids unnecessary network requests on repeat visits. 30-day expiry is a reasonable balance.

### 4. Offline detection via `navigator.onLine` + event listeners

**Choice**: Create a `useOnlineStatus` hook that tracks `navigator.onLine` via `online`/`offline` events, and an `OfflineIndicator` component that triggers a HeroUI Toast when offline and dismisses it when back online.

**Rationale**: Simple and standard approach. No service worker polling needed — `navigator.onLine` is sufficient for UI display purposes. Using the app's existing `Toast.Provider` (already in `main.tsx`) keeps the notification style consistent and gives the user a dismiss button without adding any new UI primitives.

### 5. Use browser's native install UI

**Choice**: Rely on the browser's built-in install prompt (address bar icon, browser menu) instead of a custom in-app install prompt.

**Rationale**: The `beforeinstallprompt` event API is experimental and not supported across all browsers. Using the native install UI is simpler, requires no code, and works consistently everywhere. Users can install via the browser's standard install option.

## Risks / Trade-offs

- **[Stale content after updates]** → Service worker precaches the shell; users may get stale UI after a deploy. Mitigation: `vite-plugin-pwa` auto-generates a new precache manifest on each build; the browser activates the new SW on next visit. This is acceptable for KPO since data is in localStorage and there is no server state to desync from.
- **[Build size increase]** → Service worker and precache manifest add ~5-10KB. Negligible for an app of this size.
