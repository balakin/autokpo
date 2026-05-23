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

export function getInitialEncryptionSessionState(): EncryptionSessionState {
  return { status: 'checking', hasProfile: false };
}
