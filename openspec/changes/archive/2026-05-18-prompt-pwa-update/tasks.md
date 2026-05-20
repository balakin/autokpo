## 1. Service Worker Update Registration

- [x] 1.1 Add `workbox-window` as the browser-side service worker lifecycle helper dependency required by VitePWA's virtual registration module.
- [x] 1.2 Configure `VitePWA` for prompt-driven virtual registration with `injectRegister: false` and no plugin-injected registration script.
- [x] 1.3 Replace manual `navigator.serviceWorker.register('/sw.js')` update wiring with `virtual:pwa-register/react`.
- [x] 1.4 Ensure the app uses exactly one service worker registration/update path in production.
- [x] 1.5 Preserve existing Workbox precache coverage for app shell assets and emitted JavaScript chunks.
- [x] 1.6 Name the mounted global PWA lifecycle component `PwaRegisterer` and keep update prompt rendering as an internal responsibility.

## 2. Update Prompt UX

- [x] 2.1 Add UI logic that shows a persistent localized prompt from the `needRefresh` state returned by `useRegisterSW` when a waiting service worker update is available.
- [x] 2.2 Add a defer/dismiss path that leaves the current app version running without activating the waiting worker.
- [x] 2.3 Add a reload action that calls the virtual registration update function to activate the waiting service worker and reload after takeover.
- [x] 2.4 Add or update Lingui messages and catalogs for the update prompt text in all supported locales.
- [x] 2.5 Verify controlled AutoKPO tabs reload once an accepted update is applied — handled automatically by workbox-window, no custom controllerchange listener required.

## 3. Lazy Chunk Recovery

- [x] 3.1 Add an error boundary or equivalent recovery layer around lazy signed-in app and route chunks.
- [x] 3.2 Detect common dynamic import/chunk loading failures and show a localized reload recovery message.
- [x] 3.3 Add a reload action from the chunk-load recovery UI.

## 4. Verification

- [x] 4.1 Build the app and inspect the generated service worker/registration output for prompt-driven update behavior.
- [x] 4.2 Verify generated precache output still includes emitted JavaScript chunks.
- [x] 4.3 Add or update focused tests for update prompt behavior and chunk-load recovery where practical, relying on VitePWA/workbox-window for lifecycle mechanics instead of exhaustive custom lifecycle tests.
- [x] 4.4 Run relevant app checks, including tests, build, lint, formatting, and i18n extraction if messages changed.
