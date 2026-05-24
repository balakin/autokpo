## 1. Crypto Layer

- [ ] 1.1 Add `pinSaltAad(userId, wrapperId)` function to `encryption-crypto.ts` returning `autokpo:e2ee-pin-salt:v1:{userId}:{wrapperId}`
- [ ] 1.2 Add `wrapMekWithPin(mek, pin, userId, wrapperId)` to `encryption-crypto.ts` — generates pinLdk, encrypts salt, derives KEK via Argon2id, wraps MEK; returns all fields needed for `LocalWrapperRecordPin`
- [ ] 1.3 Add `unwrapMekWithPin(record, pin)` to `encryption-crypto.ts` — decrypts salt with pinLdk, derives KEK, unwraps MEK; throws `EncryptionUnlockError` on failure

## 2. IndexedDB Schema

- [ ] 2.1 Add `localWrapperRecordPinSchema` (zod) and `LocalWrapperRecordPin` type to `keys-indexeddb.ts`
- [ ] 2.2 Update `LocalWrapperRecord` union type to include `LocalWrapperRecordPin`
- [ ] 2.3 Update `readLocalWrapper` to parse and return `method: 'pin'` records
- [ ] 2.4 Add `updatePinFailedAttempts(userId, count)` method to `KeysIndexeddb` — reads, updates `failedAttempts`, writes back
- [ ] 2.5 Add unit tests for PIN wrapper read/write round-trip in `keys-indexeddb.spec.ts`

## 3. Encryption Gate — PIN Unlock Path

- [ ] 3.1 Update `check` effect in `encryption-gate.tsx` to handle `method: 'pin'` local wrapper — fall through to PIN screen (dispatch `check-succeeded`) instead of auto-unlocking
- [ ] 3.2 Add `unlockWithPin(pin)` handler in `encryption-gate.tsx` — calls `unwrapMekWithPin`, increments `failedAttempts` on failure (deletes wrapper at 10), dispatches `unlocked` on success
- [ ] 3.3 Wire PIN unlock path into gate render — when `session.status === 'locked'` and local wrapper is `method: 'pin'`, render `<PinUnlockScreen>` instead of `<EncryptionUnlockScreen>`
- [ ] 3.4 Pass `failedAttempts` count and `onSubmit` to `<PinUnlockScreen>`

## 4. PIN Unlock Screen Component

- [ ] 4.1 Create `src/e2ee/pin-unlock-screen.tsx` — 6 digit slots, auto-submit on 6th digit, disabled during submission
- [ ] 4.2 Show loading indicator during KDF derivation (submission state)
- [ ] 4.3 Show inline error on wrong PIN; display remaining attempts when ≤ 5 left
- [ ] 4.4 Show "PIN removed, please enter your password" message when transitioning to password screen after wipe

## 5. Security Settings Tab

- [ ] 5.1 Create `src/settings/security-settings-page.tsx` — reads current `local_wrapper` method, renders appropriate state (LDK or PIN active)
- [ ] 5.2 Create `src/e2ee/set-pin-modal.tsx` — 6-digit input × 2 (PIN + confirm), validates match and length, submits
- [ ] 5.3 Wire "Set PIN code" action — opens `SetPinModal`, on submit calls `wrapMekWithPin` using MEK from `EncryptionContext`, writes to `local_wrapper`
- [ ] 5.4 Wire "Change PIN" action — same modal flow, replaces existing PIN wrapper
- [ ] 5.5 Wire "Switch to auto-unlock" action — calls `storeLdkWrapper` (existing helper), writes new LDK wrapper, updates displayed method

## 6. Settings Routing

- [ ] 6.1 Add `SecuritySettingsPage` lazy import to `route-lazy-components.tsx`
- [ ] 6.2 Add `/settings/security` route to `app-routes.tsx`
- [ ] 6.3 Add Security tab link to `settings-page.tsx` tab nav; update `selectedTab` logic
- [ ] 6.4 Update `selectedTab` detection in `settings-page.tsx` to handle `/settings/security`

## 7. Tests & i18n

- [ ] 7.1 Add unit tests for `wrapMekWithPin` / `unwrapMekWithPin` in `encryption-crypto.spec.ts`
- [ ] 7.2 Add unit tests for `pinSaltAad` in `encryption-crypto.spec.ts`
- [ ] 7.3 Add encryption gate tests for PIN unlock path and 10-attempt wipe in `encryption-gate.spec.tsx`
- [ ] 7.4 Run `pnpm i18n:extract` and add translations for all new strings (PIN screen, Security tab, modal)
