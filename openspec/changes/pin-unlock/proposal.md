## Why

The current local unlock relies on an LDK (Local Device Key) that unlocks silently and automatically — there is no user-visible authentication step on reload. Adding a PIN code gives users a lightweight friction layer: proof of presence without requiring the full encryption password.

## What Changes

- A new `method: 'pin'` local wrapper type is added to the `local_wrapper` IndexedDB store, storing a PIN-protected MEK alongside a dedicated pinLDK (non-extractable) that hardware-binds the KDF salt
- The encryption gate gains a PIN unlock screen (6-digit, auto-submits on last digit) shown when a PIN wrapper is present instead of the password screen
- A new **Security** tab is added to Settings (`/settings/security`) exposing the current local unlock method and allowing the user to switch between LDK auto-unlock and PIN, or change their PIN
- Failed PIN attempts are counted; after 10 failures the PIN wrapper is deleted and the user falls back to password unlock
- The LDK and PIN are mutually exclusive — only one `local_wrapper` record exists per user at any time

## Capabilities

### New Capabilities

- `pin-local-wrapper`: PIN-based MEK wrapper stored in IndexedDB — schema, KDF (Argon2id), pinLDK hardware binding, AAD, failed-attempt wipe
- `pin-unlock-screen`: Encryption gate screen for PIN entry — 6-digit input, auto-submit, loading state during Argon2id, error on failure
- `security-settings`: Settings Security tab — shows current unlock method, switch between LDK auto-unlock and PIN, change PIN modal

### Modified Capabilities

- `local-device-key`: The spec note about supporting a future `method: 'pin'` becomes a live constraint — the `local_wrapper` store now carries either `ldk` or `pin`, mutually exclusive, one per user
- `encryption-unlock-ui`: The gate unlock flow gains a PIN branch — when `local_wrapper.method === 'pin'`, show PIN screen instead of password screen
- `settings`: Settings gains a third route-backed tab `/settings/security` alongside General and Account

## Impact

- `src/e2ee/keys-indexeddb.ts` — new `LocalWrapperRecordPin` type and schema; `readLocalWrapper` / `writeLocalWrapper` handle the union
- `src/e2ee/encryption-crypto.ts` — `wrapMekWithPin`, `unwrapMekWithPin`, `pinSaltAad` functions; reuses `deriveKek` and `wrappedMekAad`
- `src/e2ee/encryption-gate.tsx` — PIN unlock branch in check effect and render
- `src/e2ee/encryption-gate-reducer.ts` — no new states needed; existing `unlock-submitted / unlock-failed / unlocked` cover PIN path
- `src/settings/settings-page.tsx` — third tab link + route
- `src/app-routes.tsx` — `/settings/security` route
- `src/route-lazy-components.tsx` — lazy `SecuritySettingsPage`
- New files: `src/e2ee/pin-unlock-screen.tsx`, `src/settings/security-settings-page.tsx`, `src/e2ee/set-pin-modal.tsx`
- No server-side changes — PIN wrapper is entirely local
- No new dependencies — Argon2id already runs in the existing KDF worker
