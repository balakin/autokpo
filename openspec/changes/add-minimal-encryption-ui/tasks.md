## 1. Encryption Session State

- [x] 1.1 Create the `apps/app/src/e2ee` module boundary for the minimal E2EE frontend state and UI.
- [x] 1.2 Add a minimal encryption session model in `src/e2ee` that can represent uninitialized, locked, unlocked, setup-submitting, unlock-submitting, and error states for the current auth session.
- [x] 1.3 Add placeholder encryption profile detection and password verification seams so later cryptographic storage can replace the temporary implementation without changing UI flow.
- [x] 1.4 Ensure logout/auth cleanup clears encryption session material and resets encryption state, including auth loss and local user changes.

## 2. Encryption Gate and Shell

- [x] 2.1 Insert an encryption gate from `src/e2ee` after authenticated user detection and before CRDT/app providers are mounted.
- [x] 2.2 Create the fullscreen encryption shell in `src/e2ee` with app identity, centered content area, footer, and pre-unlock profile controls for language, theme, and logout.
- [x] 2.3 Route authenticated users to setup, unlock, or signed-in app content according to encryption state.

## 3. Setup and Unlock UI

- [x] 3.1 Implement the first-time setup screen with explanatory copy, password field, confirmation field, non-recovery acknowledgement, inline validation, and submit handling.
- [x] 3.2 Implement the returning-user unlock screen with explanatory copy, password field, inline wrong-password error, and submit handling.
- [x] 3.3 Implement the forgot-password explanation path without destructive reset actions.
- [x] 3.4 Add localized messages for all new shell, setup, unlock, validation, and forgot-password UI copy.

## 4. Verification

- [x] 4.1 Add or update tests for setup validation, unlock success/failure, gate routing, and logout encryption cleanup.
- [x] 4.2 Run scoped tests for the new encryption UI and affected auth/gating code.
- [x] 4.3 Run lint/typecheck/build checks relevant to the app package.
