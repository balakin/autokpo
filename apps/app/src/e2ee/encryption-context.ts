import { createContext, use } from 'react';

export interface EncryptionContextValue {
  mek: Uint8Array;
  activeDek: Uint8Array;
  activeDekId: string;
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
