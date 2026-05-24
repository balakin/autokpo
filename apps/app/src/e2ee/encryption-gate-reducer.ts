import {
  getInitialEncryptionSessionState,
  type EncryptionSessionState,
} from './encryption-session';

export type EncryptionGateState = {
  userId: string;
  session: EncryptionSessionState;
  mek: Uint8Array | null;
  activeDek: Uint8Array | null;
  activeDekId: string | null;
};

export type EncryptionGateAction =
  | { type: 'check-succeeded' }
  | { type: 'check-missing' }
  | { type: 'check-failed' }
  | { type: 'retry-check' }
  | { type: 'setup-submitted' }
  | { type: 'setup-failed' }
  | { type: 'unlock-submitted' }
  | { type: 'unlock-failed' }
  | {
      type: 'unlocked';
      mek: Uint8Array;
      activeDek: Uint8Array;
      activeDekId: string;
    };

export function createInitialEncryptionGateState(
  userId: string,
): EncryptionGateState {
  return {
    userId,
    session: getInitialEncryptionSessionState(),
    mek: null,
    activeDek: null,
    activeDekId: null,
  };
}

export function encryptionGateReducer(
  state: EncryptionGateState,
  action: EncryptionGateAction,
): EncryptionGateState {
  switch (action.type) {
    case 'check-succeeded':
      return {
        ...state,
        session: { status: 'locked', hasProfile: true },
      };
    case 'check-missing':
      return {
        ...state,
        session: { status: 'uninitialized', hasProfile: false },
      };
    case 'check-failed':
      return {
        ...state,
        session: { status: 'error', hasProfile: false, error: 'check' },
      };
    case 'retry-check':
      return {
        ...state,
        session: { status: 'checking', hasProfile: false },
      };
    case 'setup-submitted':
      return {
        ...state,
        session: { status: 'setup-submitting', hasProfile: false },
      };
    case 'setup-failed':
      return {
        ...state,
        session: { status: 'error', hasProfile: false, error: 'setup' },
      };
    case 'unlock-submitted':
      return {
        ...state,
        session: { status: 'unlock-submitting', hasProfile: true },
      };
    case 'unlock-failed':
      return {
        ...state,
        session: { status: 'error', hasProfile: true, error: 'unlock' },
      };
    case 'unlocked':
      return {
        ...state,
        session: { status: 'unlocked', hasProfile: true },
        mek: action.mek,
        activeDek: action.activeDek,
        activeDekId: action.activeDekId,
      };
  }
}
