import { clearLocalEncryptionUnlockMaterial } from '../e2ee/cleanup';
import { clearQueriesCache } from '../query-client';

import { broadcastSessionChange } from './session-broadcast';

export async function cleanupSignedOutSession(
  userId: string | null,
): Promise<void> {
  await Promise.all([
    clearQueriesCache(),
    userId ? clearLocalEncryptionUnlockMaterial(userId) : Promise.resolve(),
  ]);
  broadcastSessionChange(null);
}
