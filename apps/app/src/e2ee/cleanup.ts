export const LOCAL_ENCRYPTION_UNLOCK_KEY = 'autokpo:e2ee:local-unlock';

/**
 * Clears local material that can unlock encrypted data on this device without
 * asking for the encryption password again.
 *
 * This intentionally does not delete the persistent encryption profile or any
 * encrypted app data. Future device/PIN unlock material should be cleared here.
 */
export function clearLocalEncryptionUnlockMaterial(): void {
  sessionStorage.removeItem(LOCAL_ENCRYPTION_UNLOCK_KEY);
}
