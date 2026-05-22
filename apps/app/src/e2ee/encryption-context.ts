import { createContext, use } from 'react';

export interface EncryptionContextValue {
  masterKey: Uint8Array;
  keyId: string;
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
