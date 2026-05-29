import { createContext, use } from 'react';

import type { DecryptedKeyRing } from './encryption-crypto';
import type {
  SerializedKeyRingProfile,
  UpdateKeyRingRequest,
} from './key-ring-record';

export interface EncryptionContextValue {
  mek: Uint8Array;
  activeDek: Uint8Array;
  activeDekId: string;
  keyRingId: string;
  keyRingRevision: number;
  deks: Record<string, Uint8Array>;
  getDek: (dekId: string) => Uint8Array | null;
  clearEncryptionSession: () => void;
  refreshKeyRingProfile: () => Promise<DecryptedKeyRing>;
  updateKeyRingProfile: (
    request: UpdateKeyRingRequest,
  ) => Promise<SerializedKeyRingProfile>;
}

export const EncryptionContext = createContext<EncryptionContextValue | null>(
  null,
);

export function useEncryptionContext(): EncryptionContextValue {
  const ctx = use(EncryptionContext);
  if (ctx === null) {
    throw new Error(
      'useEncryptionContext called outside EncryptionContext provider',
    );
  }
  return ctx;
}
