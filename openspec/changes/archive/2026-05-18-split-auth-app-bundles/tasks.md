## 1. Baseline and Routing Boundaries

- [x] 1.1 Record the current client chunk baseline from `apps/app/chunks-draft.md` and/or a fresh `pnpm -s analyze` run.
- [x] 1.2 Identify the eager auth guard modules that must remain in the public graph: `AuthProvider`, `SignedInGate`, `SignedOutGate`, signed-out pages, and catch-all redirect logic.
- [x] 1.3 Confirm direct protected-route visits while signed out redirect to `/sign-in` before signed-in app modules are needed.

## 2. Signed-In Shell Split

- [x] 2.1 Move `SignedInApp` behind a lazy boundary that is rendered only after `SignedInGate` sees `AuthContext.user`.
- [x] 2.2 Add an appropriate loading fallback for the signed-in shell import without changing signed-out auth UI.
- [x] 2.3 Verify `CrdtProvider` still receives the authenticated user id and initializes only for signed-in users.
- [x] 2.4 Verify `/dashboard`, `/books`, `/books/:bookId`, `/settings/general`, and `/settings/account` still render inside `AppShell` after the shell loads.

## 3. Signed-In Route Chunking

- [x] 3.1 Convert signed-in page routes to lazy route modules or dynamic imports: dashboard, book library, book scope, settings layout, general settings, and account settings.
- [x] 3.2 Preserve nested settings redirects and child route rendering under the settings layout.
- [x] 3.3 Ensure route-level loading behavior keeps `AppShell` visible where practical while page chunks load.
- [x] 3.4 Verify unrelated signed-in page modules are no longer required before the selected signed-in route can render.

## 4. Tests and Regression Checks

- [x] 4.1 Update route/auth tests that assume synchronous route rendering to await lazy route resolution.
- [x] 4.2 Add or update tests covering signed-out direct navigation to protected routes and signed-in navigation to lazy app routes.
- [x] 4.3 Run targeted route/auth tests with Vitest verbose reporter.
- [x] 4.4 Run the app build to verify TypeScript and production bundling succeed.

## 5. Bundle and PWA Verification

- [x] 5.1 Run the bundle analysis build and compare the eager `index` chunk against the recorded baseline.
- [x] 5.2 Confirm output contains lazy chunks for the signed-in shell and/or signed-in pages.
- [x] 5.3 Confirm lazy JavaScript chunks match the service worker precache glob.
- [x] 5.4 Document the before/after chunk sizes and any notable remaining auth-path dependencies, including `react-hook-form`/`zod` if still eager through `EmailForm`.

## 6. Implementation Notes

- [x] 6.1 Route graph was moved into `createAppRoutes()`; `router.tsx` now composes it into `createBrowserRouter()`.
- [x] 6.2 The signed-in loading path is `SignedInGate` → `LazySignedInBoundary` → `LazySignedInApp` → `SignedInApp` → `CrdtProvider` → `AppShell`.
- [x] 6.3 Signed-in page imports are split for dashboard, book library, book scope, settings layout, general settings, and account settings.
- [x] 6.4 Router tests cover signed-out direct protected-route redirects and remembered signed-in lazy dashboard rendering.
- [x] 6.5 Current build evidence: eager entry `793.68 kB` raw / `249.98 kB` gzip, lazy `signed-in-app` chunk `27.48 kB` raw / `9.61 kB` gzip, route chunks for dashboard/books/settings, and PWA precache output with `46 entries (4190.13 KiB)`.
