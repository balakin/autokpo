## Context

The pre-change client build emitted a large eager `index.js` bundle for all browser entry paths. Existing analysis in `apps/app/chunks-draft.md` showed the main bundle at about 1,378 kB raw / 420 kB gzip and mostly vendor code. Signed-in-only code such as Yjs/CRDT infrastructure, app shell chrome, entries, books, settings, date/table UI, and route pages was imported statically from `src/router.tsx`, so it was present even for signed-out users opening `/sign-in`.

The implemented router keeps those boundaries explicit in `createAppRoutes()`:

```txt
AuthProvider
├─ SignedInGate
│  └─ LazySignedInBoundary
│     └─ LazySignedInApp
│        └─ SignedInApp
│           └─ CrdtProvider
│              └─ AppShell
│                 └─ Suspense
│                    └─ Outlet
├─ SignedOutGate
│  └─ AuthEmailProvider
│     └─ Outlet
└─ * loader
   └─ readStoredSession() redirect
```

Signed-in child pages are also wrapped in lazy components:

```txt
DashboardPage          -> import('./dashboard/dashboard-page')
BookLibrary            -> import('./books/book-library')
BookScope              -> import('./books/book-scope')
SettingsPage           -> import('./settings/settings-page')
GeneralSettingsPage    -> import('./settings/general-settings-page')
AccountSettingsPage    -> import('./settings/account-settings-page')
```

The previous unsplit shape was:

```txt
AuthProvider
├─ SignedInGate
│  └─ SignedInApp
│     └─ CrdtProvider
│        └─ AppShell
│           └─ Outlet
└─ SignedOutGate
   └─ AuthEmailProvider
      └─ Outlet
```

`AppShell` renders an `<Outlet />` in its main content area and now wraps it in `Suspense` with a content-area skeleton. It remains the signed-in layout while child pages are lazy-loaded beneath it. The important constraint is that signed-in-only imports must not be requested until `SignedInGate` has determined that `auth.user` exists.

## Goals / Non-Goals

**Goals:**

- Reduce the initial public authentication bundle by moving signed-in-only app code out of the eager route module graph.
- Preserve existing auth redirects, signed-in route protection, and signed-out route behavior.
- Preserve the signed-in shell UX: top bar, sidebar, mobile drawer, profile access, and route content rendered through `<Outlet />`.
- Split signed-in route pages so page-specific dependencies can load on demand.
- Keep lazy chunks covered by the existing PWA precache glob.
- Make the bundle impact measurable against the existing baseline and the current Vite visualizer output.

**Non-Goals:**

- Replacing `react-hook-form`, `zod`, HeroUI, React Router, or Yjs.
- Redesigning the authentication UI or changing OAuth / email OTP behavior.
- Changing CRDT persistence, sync behavior, worker APIs, database schema, or user data formats.
- Optimizing every remaining dependency in the public auth path; the email form validation stack can be evaluated separately after this split is measured.

## Decisions

### Auth gate remains eager; signed-in app loads lazily behind it

Keep `AuthProvider`, `SignedInGate`, `SignedOutGate`, auth pages, and redirect logic in the eager graph. Convert the expensive signed-in app subtree into a lazy-loaded boundary that is only rendered after `SignedInGate` sees an authenticated user. In the implementation, `LazySignedInBoundary` owns the shell-level `Suspense` fallback and `LazySignedInApp` dynamically imports `signed-in-app`.

Rationale: this preserves security and avoids downloading CRDT/app code for users who will be redirected to `/sign-in`.

Alternative considered: make the whole signed-in route object lazy. That is simpler, but React Router may resolve route lazy modules before rendering the guard for direct signed-out visits to protected URLs. The explicit eager guard keeps the auth decision in front of the expensive import.

### Use nested route lazy loading for signed-in pages

Use dynamic imports for signed-in page components beneath `AppShell`: dashboard, book library, book scope, settings layout, general settings, and account settings.

Rationale: a signed-in shell chunk containing `CrdtProvider` and layout chrome should not also force every page and page-specific dependency to parse before the first signed-in screen can render.

Alternative considered: split only `SignedInApp`. This yields a large public-auth improvement, but returning signed-in users still parse all signed-in pages immediately after auth resolution.

### Prefer shell-visible fallbacks for signed-in route loading

For loading signed-in child pages, keep the app shell visible and show loading UI in the content area. The implementation adds a shared `PageLoadingSkeleton`; the shell import fallback uses shell-shaped skeleton chrome, while child-route fallback is rendered inside `AppShell`'s main content area.

Rationale: after sign-in, users should see stable navigation chrome rather than a full-screen blank/spinner for every route transition.

Alternative considered: one top-level Suspense fallback around all signed-in UI. This is simpler but hides the shell while child pages load.

### Measure before optimizing auth form dependencies

Current analysis shows `src/auth/email-form.tsx` pulls `react-hook-form`, `zod`, and `@hookform/resolvers` into the public auth path. This proposal does not replace that stack; it only separates auth from signed-in app code.

Rationale: the signed-in split is the lower-risk architectural win. Removing Zod/RHF from email-only auth forms is a separate product/consistency trade-off and should be measured after the app split lands.

Alternative considered: combine the bundle split with replacing the email form validation stack. That may reduce the public bundle further but increases scope and risk.

## Risks / Trade-offs

- Lazy import accidentally placed before `SignedInGate` → signed-in chunks could load for signed-out users. Mitigation: keep the guard component eager and add tests or import-graph review around direct protected-route visits.
- Loading fallbacks could regress perceived UX after sign-in. Mitigation: use content-area fallbacks under `AppShell` where possible and keep a minimal full-screen fallback only for the signed-in shell import.
- More chunks can increase request count. Mitigation: Vite modulepreload and the service worker precache should make repeat visits cheap; validate generated chunk names and precache coverage.
- Bundle-size gains may be smaller than expected because auth still imports shared UI/form dependencies. Mitigation: report before/after chunk sizes separately for public auth, signed-in shell, and route chunks.
- Tests that assume synchronous route rendering may need to await lazy route resolution. Mitigation: update route tests to use async RTL queries where appropriate.

## Migration Plan

1. Introduced the lazy signed-in boundary without changing route paths or auth semantics.
2. Split signed-in route pages beneath the app shell.
3. Added router boundary tests for signed-out protected-route redirect and remembered signed-in dashboard load.
4. Built with bundle analysis and compared against the current baseline from `apps/app/chunks-draft.md`.
5. If regressions occur, rollback is straightforward: restore static imports in the route graph and remove the lazy wrappers.

## Verification Notes

- Route test coverage verifies that a signed-out `/dashboard` visit redirects to the sign-in page without rendering `SignedInApp` or the dashboard page.
- Route test coverage verifies that a remembered signed-in `/dashboard` visit loads both the lazy signed-in app and lazy dashboard route.
- Current production build evidence shows the eager client entry at `793.68 kB` raw / `249.98 kB` gzip, down from the recorded `1,378 kB` raw / `420 kB` gzip baseline.
- Current emitted lazy chunks include `signed-in-app` (`27.48 kB` raw / `9.61 kB` gzip), `dashboard-page` (`7.36 kB`), `book-library` (`10.92 kB`), `book-scope` (`323.14 kB`), `settings-page` (`1.86 kB`), `general-settings-page` (`7.16 kB`), and `account-settings-page` (`23.54 kB`).
- Current PWA build output reports `46 entries (4190.13 KiB)` in the precache, covering emitted JavaScript chunks through the existing Vite PWA configuration.

## Open Questions

- Should the auth email form validation stack be a follow-up proposal if the public auth chunk remains larger than desired?
