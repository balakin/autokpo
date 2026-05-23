## 1. Shared IndexedDB utilities

- [ ] 1.1 Create `src/indexeddb/idb.ts` with generic `openDatabase`, `deleteDatabase`, `withStore`, `requestToPromise`, `toError` — generalize `withStore` to accept store name as parameter
- [ ] 1.2 Write `src/indexeddb/idb.spec.ts` — test `openDatabase` creates object stores, `withStore` reads/writes records, error paths
- [ ] 1.3 Refactor `src/crdt/encrypted-indexeddb-persistence.ts` to import shared primitives from `src/indexeddb/idb.ts`, removing its private copies

## 2. KeysIndexeddb class

- [ ] 2.1 Create `src/e2ee/keys-indexeddb.ts` with `KeysIndexeddb` class: constructor opens `autokpo-e2ee` DB (version 1) with three object stores — `key_ring` (keyPath `userId`), `wrapper` (keyPath `userId`, unique index on `wrappingId`), `local_wrapper` (keyPath `userId`) — `whenReady` promise, `close()` method
- [ ] 2.2 Add typed records: `KeyRingRecord`, `WrapperRecord`, `LocalWrapperRecord` (discriminated union on `method: 'ldk' | 'pin'`) with Zod schemas for validation on read
- [ ] 2.3 Implement `readKeyRing`, `writeKeyRing`, `readWrapper`, `writeWrapper`, `readLocalWrapper`, `writeLocalWrapper`, `deleteLocalWrapper`, `clearSessionData` (deletes `local_wrapper` for userId)
- [ ] 2.4 Write `src/e2ee/keys-indexeddb.spec.ts` — test each CRUD method round-trips correctly, `clearSessionData` deletes only `local_wrapper`, `CryptoKey` survives IndexedDB round-trip

## 3. LDK crypto operations

- [ ] 3.1 Add `generateLdk` to `src/e2ee/encryption-crypto.ts` — generates non-extractable AES-256-GCM CryptoKey
- [ ] 3.2 Add `wrapMekWithLdk` — wraps MEK bytes using the LDK CryptoKey with a random IV and AAD `autokpo:e2ee-wrapped-mek:v1:{userId}:{wrapperId}:ldk`
- [ ] 3.3 Add `unwrapMekWithLdk` — unwraps MEK using the LDK CryptoKey, throws `EncryptionUnlockError` on failure
- [ ] 3.4 Add tests for `generateLdk`, `wrapMekWithLdk`, `unwrapMekWithLdk` in `src/e2ee/__tests__/encryption-crypto.spec.ts`

## 4. EncryptionGate: IndexedDB integration and auto-unlock

- [ ] 4.1 Initialize `KeysIndexeddb` via `useRef` in `EncryptionGateForUser`, close on unmount
- [ ] 4.2 Replace all `readCachedKeyRingProfile` / `writeCachedKeyRingProfile` calls with `store.readKeyRing` / `store.writeKeyRing` and `store.readWrapper` / `store.writeWrapper`
- [ ] 4.3 Add `auto-unlock` path to the `checking` effect: after key ring is confirmed present, attempt `store.readLocalWrapper` → if `method: 'ldk'`, call `unwrapMekWithLdk` → on success dispatch `unlocked`, on failure delete stale wrapper and fall through to `locked`
- [ ] 4.4 After successful password unlock, call `generateLdk` + `wrapMekWithLdk` + `store.writeLocalWrapper` to store the new LDK wrapper
- [ ] 4.5 After successful setup, call `generateLdk` + `wrapMekWithLdk` + `store.writeLocalWrapper`
- [ ] 4.6 Update `EncryptionGateAction` and `encryptionGateReducer` to handle auto-unlock path (add `'auto-unlocking'` status or reuse existing `'checking'` → `'unlocked'` transition)

## 5. Logout cleanup

- [ ] 5.1 Update `clearLocalEncryptionUnlockMaterial` in `src/e2ee/cleanup.ts` to accept the `KeysIndexeddb` instance and call `store.clearSessionData(userId)`
- [ ] 5.2 Wire the updated cleanup function to the logout path (wherever `clearLocalEncryptionUnlockMaterial` is called from the auth module)

## 6. Remove localStorage cache

- [ ] 6.1 Delete `src/e2ee/key-ring-cache.ts` and `src/e2ee/__tests__/key-ring-cache.spec.ts`
- [ ] 6.2 Remove all imports of `readCachedKeyRingProfile` / `writeCachedKeyRingProfile` from the codebase
- [ ] 6.3 Run `pnpm -s build 2>&1 | grep -E 'error TS|error:'` and fix any remaining type errors

## 7. Validation

- [ ] 7.1 Run full test suite: `cd apps/app && pnpm -s test --reporter=verbose | tail -n 120`
- [ ] 7.2 Run typecheck and build: `cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:'`
