import { KeysIndexeddb } from './keys-indexeddb';

/**
 * Clears session-scoped encryption material for the given user.
 * Deletes the `local_wrapper` IndexedDB record so the next session requires
 * the encryption password before auto-unlock is restored.
 */
export async function clearLocalEncryptionUnlockMaterial(
  userId: string,
): Promise<void> {
  const store = new KeysIndexeddb();
  await store.whenReady
    .then(() => store.clearSessionData(userId))
    .finally(() => store.close());
}
