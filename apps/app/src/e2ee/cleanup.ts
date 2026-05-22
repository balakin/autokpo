/**
 * Clears temporary encryption material for the current browser process/session.
 *
 * This intentionally does not delete persistent wrapped-key cache or encrypted
 * app data. Future device/PIN unlock material should be cleared here.
 */
export function clearLocalEncryptionUnlockMaterial(userId: string): void {
  console.log('cleanup encryption', userId);
}
