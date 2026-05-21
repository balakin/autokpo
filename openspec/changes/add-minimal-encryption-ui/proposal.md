## Why

Users need a clear, trustworthy step after authentication to set up or unlock encryption before app data is mounted. This minimal UI establishes the product boundary between signing in to an account and unlocking encrypted data without adding optional security settings yet.

## What Changes

- Add a fullscreen encryption shell shown after auth and before the main app, with account access available before encrypted data mounts.
- Add first-time encryption setup UI that explains the encryption password, collects and confirms it, and requires acknowledgement that it cannot be recovered.
- Add returning-user unlock UI that asks for the encryption password and keeps data unlocked for the current auth session.
- Add a simple forgot-password explanation path that states encrypted data cannot be recovered without the encryption password.
- Introduce the minimal E2EE frontend module structure under `apps/app/src/e2ee` to own encryption session state, shell, gate, setup, and unlock UI.
- Clear session encryption unlock material on logout, auth-session loss, and authenticated-user changes.
- Defer PIN unlock, configurable session strategies, password change, destructive reset, and security settings tab to future changes.

## Capabilities

### New Capabilities

- `encryption-unlock-ui`: Post-auth encryption setup and unlock experience, including fullscreen shell, setup form, unlock form, recovery messaging, and session-scoped unlock behavior.

### Modified Capabilities

- `user-auth`: Authenticated sessions must pass through encryption setup/unlock before entering the data-backed app, and logout must clear encryption session material.

## Impact

- Affects authenticated app entry, signed-in routing/gating, logout/auth cleanup handling, and signed-in provider mounting order.
- Adds a new app source module at `apps/app/src/e2ee` for E2EE-related frontend boundaries.
- Adds new UI components for encryption shell, setup, unlock, forgot-password explanation, and a pre-unlock profile popover/drawer.
- Uses existing theme/language controls, user avatar, offline sign-out guard, and app visual patterns where possible.
- Does not introduce full cryptographic persistence or remote E2EE protocol changes in this UI-focused change; it defines the minimal user-facing boundary needed for those later layers.
