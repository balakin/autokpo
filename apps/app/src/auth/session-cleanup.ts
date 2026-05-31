import { clearLocalEncryptionUnlockMaterial } from '../e2ee/cleanup';
import { clearProtectedCaches } from '../pwa/clear-protected-caches';

import { broadcastSessionChange } from './session-broadcast';

export async function cleanupSignedOutSession(
  userId: string | null,
): Promise<void> {
  await Promise.all([
    clearProtectedCaches(),
    userId ? clearLocalEncryptionUnlockMaterial(userId) : Promise.resolve(),
  ]);
  broadcastSessionChange(null);
}
