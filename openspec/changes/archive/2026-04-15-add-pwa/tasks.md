## 1. Dependencies & Build Configuration

- [x] 1.1 Install `vite-plugin-pwa` as a dev dependency
- [x] 1.2 Configure `vite-plugin-pwa` in `vite.config.ts` with `generateSW` strategy, precache of app shell, and CacheFirst runtime caching for font assets (30-day expiration)
- [x] 1.3 Enhance `public/site.webmanifest` with `description`, `start_url`, and verify `display: standalone`, `theme_color`, `background_color`, and icon entries

## 2. Service Worker Registration

- [x] 2.1 Create `src/pwa/register-sw.ts` that registers the service worker on app startup (production only)
- [x] 2.2 Import and call `registerSw()` in `src/main.tsx`

## 3. Offline Detection

- [x] 3.1 Create `src/pwa/use-online-status.ts` hook that tracks `navigator.onLine` via `online`/`offline` events
- [x] 3.2 Create `src/pwa/offline-indicator.tsx` component that shows a persistent dismissable HeroUI Toast when offline and closes it when back online using `useOnlineStatus`
- [x] 3.3 Write tests for `useOnlineStatus` hook
- [x] 3.4 Write tests for `OfflineIndicator` component

## 4. Integration

- [x] 4.1 Add `OfflineIndicator` to the app component tree in `src/main.tsx`
- [x] 4.2 Run full build to verify service worker generation and manifest correctness
- [x] 4.3 Run full test suite and lint
