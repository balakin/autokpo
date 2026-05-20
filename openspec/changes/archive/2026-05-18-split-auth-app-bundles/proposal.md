## Why

The client entry bundle was large for the sign-in path: `index.js` was about 1,378 kB raw / 420 kB gzip, and it eagerly included signed-in-only application code such as CRDT/Yjs infrastructure, app shell chrome, settings, books, entries, and route pages. Splitting the public authentication experience from the signed-in application reduces initial parse/eval cost for signed-out users while preserving route behavior and PWA caching.

## What Changes

- Move the route definition into `createAppRoutes()` and keep `router.tsx` as the browser-router composition point.
- Introduce a bundle-loading boundary between the public authentication route group and the signed-in application shell.
- Keep `AuthProvider`, `SignedInGate`, `SignedOutGate`, signed-out pages, and catch-all redirect logic eager so unauthenticated users can be redirected without loading signed-in application code.
- Lazy-load the signed-in application shell after `SignedInGate` confirms a user is present.
- Lazy-load signed-in route pages under `AppShell` so page-specific code and dependencies are split from the signed-in shell.
- Preserve current route behavior, redirects, localization, auth flows, CRDT initialization semantics, and PWA offline caching behavior.
- Add bundle-size verification notes for the implementation and keep measurement repeatable through the existing app `analyze` script.

## Capabilities

### New Capabilities

- `frontend-bundle-splitting`: Defines requirements for separating public authentication code from signed-in application code and measuring the resulting client chunks.

### Modified Capabilities

- `app-shell`: The app shell must continue to render signed-in child routes correctly when loaded behind a lazy signed-in boundary.
- `pwa-offline`: Lazy-loaded JavaScript chunks must remain covered by the existing service worker precache strategy.
- `user-auth`: Authentication gates and redirects must continue to protect signed-in routes without loading signed-in-only modules before the auth decision.

## Impact

- Affected app code: `apps/app/src/router.tsx`, `apps/app/src/app-routes.tsx`, `apps/app/src/route-lazy-components.tsx`, `apps/app/src/signed-in-app.tsx`, `apps/app/src/app-shell/app-shell.tsx`, `apps/app/src/app-shell/page-loading-skeleton.tsx`, and signed-in route page imports.
- Affected build tooling: Vite/Rolldown chunk output and `rollup-plugin-visualizer` analysis output.
- Affected runtime behavior: dynamic imports and loading fallbacks around the signed-in app shell and signed-in routes.
- No API, database, worker, or persisted data format changes are expected.

## Implementation Notes

- Implemented route boundary: `SignedInGate` → `LazySignedInBoundary` → `LazySignedInApp` → `SignedInApp` → `CrdtProvider` → `AppShell`.
- Implemented lazy route wrappers for dashboard, book library, book scope, settings layout, general settings, and account settings.
- `AppShell` keeps the signed-in chrome mounted around a suspense-wrapped `<Outlet />` for child route loading.
- Signed-out routes (`/sign-in`, `/sign-in/code`, `/goodbye`) remain eager under `SignedOutGate` and `AuthEmailProvider`.
- The catch-all route still redirects from stored session state to `/dashboard` or `/sign-in`.
