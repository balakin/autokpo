## REMOVED Requirements

### Requirement: Protected API runtime caches are explicit

**Reason**: No protected API runtime caches remain after this change. The two Workbox `runtimeCaching` entries for `/api/auth/get-session` and `/api/e2ee/key-ring` are deleted as part of the migration to React Query IDB persistence. The service worker retains only asset precaching and navigation fallback.

**Migration**: No runtime caches to declare. The `vite.config.ts` `workbox.runtimeCaching` array becomes empty and can be removed entirely.
