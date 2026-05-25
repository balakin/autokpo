## 1. Server API

- [ ] 1.1 Add request parsing and validation for `POST /api/e2ee/key-ring/change-password`, including `currentWrappingId`, safe UUIDs, supported KDF/wrapping params, base64 decoding, and byte-length checks.
- [ ] 1.2 Implement server-side compare-and-swap replacement so the active password wrapper is revoked and the new active wrapper is inserted atomically only when `currentWrappingId` matches.
- [ ] 1.3 Return success without a profile body on successful change, validation errors for malformed payloads, and conflict errors for stale/wrong `currentWrappingId`.
- [ ] 1.4 Add worker tests for successful replacement, stale-wrapper conflict, invalid parameters, one-active-wrapper invariant, and preservation of the existing key-ring row.

## 2. Client Crypto and API

- [ ] 2.1 Add a crypto helper that wraps an existing in-memory MEK with a KEK derived from a new master password using existing KDF/AES-GCM constants and password-wrapper AAD.
- [ ] 2.2 Add client API support for calling `POST /api/e2ee/key-ring/change-password` with the new wrapper payload and current active wrapper id.
- [ ] 2.3 Add crypto/API tests covering new wrapper creation, AAD binding, same-password allowance, and request serialization.

## 3. Encryption Session and Cache Handling

- [ ] 3.1 Expose or reuse an encryption-session clearing path that clears in-memory key material without signing out the authenticated user.
- [ ] 3.2 After successful password change, refetch the key-ring profile through the existing fetch/cache path so IndexedDB stores the new active password wrapper.
- [ ] 3.3 On stale-wrapper conflict or 10 failed verification attempts, clear the encryption session and refetch the key-ring profile when applicable.
- [ ] 3.4 Add tests for cache refresh after success, local wrapper preservation, and encryption-session clearing on conflict/failure limit.

## 4. Security Settings UI

- [ ] 4.1 Add a Change master password action to Settings → Security and open a modal only from the unlocked app state.
- [ ] 4.2 Implement modal verification step: PIN verification when `local_wrapper.method === 'pin'`, otherwise current master password verification.
- [ ] 4.3 Enforce 10 failed verification attempts for both PIN and current-password verification, then clear the encryption session.
- [ ] 4.4 Implement new password and confirmation step using existing master-password validation rules while allowing the same password value.
- [ ] 4.5 Submit the change request, handle success by refetching profile and showing a success toast, and surface existing errors for refetch or API failures.
- [ ] 4.6 Add React tests for PIN flow, current-password flow, validation errors, retry-limit clearing, successful toast/refetch, and conflict handling.

## 5. Localization and Verification

- [ ] 5.1 Add and translate all new UI strings for Serbian source, English, and Russian catalogs.
- [ ] 5.2 Run focused Vitest suites for worker E2EE, crypto, IndexedDB/cache, and Security settings UI.
- [ ] 5.3 Run package build/typecheck and targeted lint/format checks for changed files.
