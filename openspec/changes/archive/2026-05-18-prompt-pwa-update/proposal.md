## Why

AutoKPO precaches code-split JavaScript chunks for offline use, which is useful, but automatically activating a new service worker over an already-running app can create version skew between old React code and the new precache. Users should control when an installed/running app updates so work in progress is not interrupted and lazy route chunks stay consistent until reload.

## What Changes

- Change PWA update behavior from automatic activation to a prompt-driven update flow.
- Use VitePWA's virtual React registration binding backed by `workbox-window` as the single explicit service worker registration/update path.
- Notify the user when a new app version is available.
- Let the user choose to reload now or defer the update.
- Activate the waiting service worker only after the user chooses to reload, then reload controlled tabs once the new worker controls them.
- Add recovery UX for lazy chunk load failures that asks the user to reload when an app update is likely required.
- Preserve existing precaching of emitted JavaScript chunks and app shell assets for offline support.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pwa-offline`: Add prompt-driven service worker update lifecycle behavior and chunk-load recovery while keeping existing offline precache coverage.

## Impact

- Affects PWA registration/update code under `apps/app/src/pwa/`.
- Affects `apps/app/vite.config.ts` service worker registration mode.
- Adds `workbox-window` as the browser-side service worker lifecycle helper dependency used by VitePWA's virtual registration module.
- Adds user-facing update prompt text that must participate in Lingui i18n extraction/translation.
- May affect route/lazy error handling for chunk load failures.
- No database or API changes expected.
