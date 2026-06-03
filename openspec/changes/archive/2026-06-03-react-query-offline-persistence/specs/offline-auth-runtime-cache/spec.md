## REMOVED Requirements

### Requirement: Protected session and key-ring GETs use NetworkFirst runtime caches

**Reason**: Replaced by React Query IDB persistence (`query-offline-persistence`). Service worker runtime caching for API data is unreliable across platforms (iOS Safari, first visit before SW install, SW update cycle) and is no longer the mechanism for offline data availability.

**Migration**: Session and key-ring data are now persisted to IndexedDB via `PersistQueryClientProvider`. The `sw-cache-names.ts` constants, `clear-protected-caches.ts` utility, and associated Workbox `runtimeCaching` entries are deleted. Sign-out cleanup calls `clearQueriesCache()` (from `src/query-client`) instead of `clearProtectedCaches()`.

### Requirement: Protected runtime caches are cleared on auth boundaries

**Reason**: Replaced by `query-offline-persistence` requirement "Persisted cache is cleared on sign-out and account deletion". The CacheStorage-based cleanup (`clearProtectedCaches`) is removed; `clearQueriesCache()` from `src/query-client` is the new auth-boundary cleanup mechanism.

**Migration**: `session-cleanup.ts` calls `clearQueriesCache()` in place of `clearProtectedCaches()`.
