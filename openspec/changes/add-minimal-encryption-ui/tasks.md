## 1. Encryption Session State

- [ ] 1.1 Create the `apps/app/src/e2ee` module boundary for the minimal E2EE frontend state and UI.
- [ ] 1.2 Add a minimal encryption session model in `src/e2ee` that can represent uninitialized, locked, unlocked, setup-submitting, unlock-submitting, and error states for the current auth session.
- [ ] 1.3 Add placeholder encryption profile detection and password verification seams so later cryptographic storage can replace the temporary implementation without changing UI flow.
- [ ] 1.4 Ensure logout/auth cleanup clears encryption session material and resets encryption state.

## 2. Encryption Gate and Shell

- [ ] 2.1 Insert an encryption gate from `src/e2ee` after authenticated user detection and before CRDT/app providers are mounted.
- [ ] 2.2 Create the fullscreen encryption shell in `src/e2ee` with app identity, centered content area, language selector, and theme selector.
- [ ] 2.3 Route authenticated users to setup, unlock, or signed-in app content according to encryption state.

## 3. Setup and Unlock UI

- [ ] 3.1 Implement the first-time setup screen with explanatory copy, password field, confirmation field, non-recovery acknowledgement, inline validation, and submit handling.
- [ ] 3.2 Implement the returning-user unlock screen with explanatory copy, password field, inline wrong-password error, and submit handling.
- [ ] 3.3 Implement the forgot-password explanation path without destructive reset actions.
- [ ] 3.4 Add localized messages for all new shell, setup, unlock, validation, and forgot-password UI copy.

## 4. Verification

- [ ] 4.1 Add or update tests for setup validation, unlock success/failure, gate routing, and logout encryption cleanup.
- [ ] 4.2 Run scoped tests for the new encryption UI and affected auth/gating code.
- [ ] 4.3 Run lint/typecheck/build checks relevant to the app package.
