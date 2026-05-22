import { readCachedEncryptionKeyRecord } from './encryption-key-cache';

export type EncryptionSessionStatus =
  | 'uninitialized'
  | 'checking'
  | 'locked'
  | 'unlocked'
  | 'setup-submitting'
  | 'unlock-submitting'
  | 'error';

export type EncryptionSessionState = {
  status: EncryptionSessionStatus;
  hasProfile: boolean;
  error?: 'check' | 'setup' | 'unlock';
};

export function hasEncryptionProfile(userId: string): boolean {
  return readCachedEncryptionKeyRecord(userId) !== null;
}

export function getInitialEncryptionSessionState(
  userId: string,
): EncryptionSessionState {
  const hasProfile = hasEncryptionProfile(userId);
  if (!hasProfile) {
    return { status: 'checking', hasProfile };
  }
  return { status: 'locked', hasProfile };
}
