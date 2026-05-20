## Context

AutoKPO is a local-first productivity app that precaches the app shell and emitted JavaScript chunks for offline use. Route-level code splitting means a running app version can lazy-load chunks after the initial page load. If a newly deployed service worker activates and claims an existing tab while that tab is still running older JavaScript, lazy imports can request old chunk URLs while the new service worker only has the new precache, causing chunk load failures.

The app currently has explicit service worker registration in `src/pwa/register-sw.ts` and PWA plugin registration settings in `vite.config.ts`. This change should make the update lifecycle intentional and user-visible: detect an available update, prompt the user, and activate/reload only when the user chooses. To avoid hand-rolling service worker lifecycle edge cases, the implementation should use VitePWA's React virtual registration binding, which relies on `workbox-window` for page-side service worker lifecycle events.

## Goals / Non-Goals

**Goals:**

- Keep existing offline support and JavaScript chunk precaching.
- Change update activation from automatic takeover to user-confirmed reload.
- Ensure there is one clear service worker registration/update path through VitePWA's React virtual module.
- Show a persistent localized prompt when a new app version is available.
- Activate the waiting service worker only after the user chooses to reload.
- Use `workbox-window`/VitePWA lifecycle events instead of custom `updatefound`/`statechange` wiring.
- Recover gracefully from lazy chunk load failures by offering a reload path.

**Non-Goals:**

- Do not remove JavaScript chunk precaching.
- Do not add background sync or data migration behavior.
- Do not force automatic reloads while the user may be editing app data.
- Do not redesign the offline indicator UI beyond what is necessary for update prompting.
- Do not maintain a parallel manual `navigator.serviceWorker.register('/sw.js')` update implementation.

## Decisions

- **Use prompt-driven service worker updates.** A waiting service worker SHALL remain waiting until the user chooses to reload. This avoids mixing an old running React runtime with a newly activated precache.
- **Use VitePWA's React virtual registration binding from a global registerer component.** The implementation should mount a `PwaRegisterer` component that uses `virtual:pwa-register/react` as the single service worker registration/update path. This requires adding `workbox-window`, which provides the browser-side service worker lifecycle helper used by the virtual registration module. The update prompt is driven by the reactive `needRefresh` state from `useRegisterSW` via a `useEffect`, which ensures the prompt appears even if the SW was already waiting when the component mounted.
- **Keep prompt UI as an internal concern of the registerer.** The prompt should be visible until the user chooses reload or dismisses/defers it. Copy should be localized with Lingui because this is user-facing UI.
- **Reload all controlled tabs after explicit user action.** The reload action should call the virtual registration update function to activate the waiting worker. Controlled AutoKPO tabs reload when the new worker controls them, so the leader/follower tab set does not keep old app runtimes under the new service worker. workbox-window handles reloading all controlled tabs automatically — no custom `controllerchange` listener is needed in the app.
- **Add chunk-load recovery at the lazy route boundary.** Lazy import failures that look like missing/failed chunks should show a localized reload recovery UI rather than leaving the user at a broken Suspense/error state.

## Risks / Trade-offs

- **Users may defer updates indefinitely.** → Keep the prompt persistent enough to be discoverable, but do not block work; the app remains usable on the old cached version.
- **Prompt implementation could duplicate service worker registration.** → Remove the manual registration call and use only the VitePWA React virtual registration path with `injectRegister: false`.
- **Chunk-load error detection can be browser-specific.** → Detect common dynamic import/chunk load failure signals and use a generic reload fallback for unexpected lazy route errors.
- **Activating a waiting worker incorrectly could reload too early or twice.** → Keep activation gated behind explicit user action and handle global `controllerchange` carefully so each tab reloads once.
