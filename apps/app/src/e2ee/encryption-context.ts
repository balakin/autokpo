import { createContext, use } from 'react';

import type {
  SerializedKeyRingProfile,
  UpdateKeyRingRequest,
} from './key-ring-record';

export interface EncryptionContextValue {
  mek: Uint8Array;
  activeDek: Uint8Array;
  activeDekId: string;
  clearEncryptionSession: () => void;
  refreshKeyRingProfile: () => Promise<void>;
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
