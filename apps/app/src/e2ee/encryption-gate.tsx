import { useState, type ReactNode } from 'react';

import {
  createPlaceholderEncryptionProfile,
  getInitialEncryptionSessionState,
  unlockEncryptionSession,
  verifyPlaceholderEncryptionPassword,
  type EncryptionSessionState,
} from './encryption-session';
import { EncryptionSetupScreen } from './encryption-setup-screen';
import { EncryptionShell } from './encryption-shell';
import { EncryptionUnlockScreen } from './encryption-unlock-screen';

type EncryptionGateProps = {
  userId: string;
  children: ReactNode;
};

type GateState = {
  userId: string;
  state: EncryptionSessionState;
};

export function EncryptionGate({ userId, children }: EncryptionGateProps) {
  const [gateState, setGateState] = useState<GateState>(() => ({
    userId,
    state: getInitialEncryptionSessionState(userId),
  }));
  const state =
    gateState.userId === userId
      ? gateState.state
      : getInitialEncryptionSessionState(userId);

  function setState(nextState: EncryptionSessionState) {
    setGateState({ userId, state: nextState });
  }

  function setup(password: string) {
    setState({ status: 'setup-submitting', hasProfile: false });
    try {
      createPlaceholderEncryptionProfile(userId, password);
      setState({ status: 'unlocked', hasProfile: true });
    } catch {
      setState({ status: 'error', hasProfile: false, error: 'setup' });
    }
  }

  function unlock(password: string) {
    setState({ status: 'unlock-submitting', hasProfile: true });
    if (verifyPlaceholderEncryptionPassword(userId, password)) {
      unlockEncryptionSession(userId);
      setState({ status: 'unlocked', hasProfile: true });
      return;
    }
    setState({ status: 'error', hasProfile: true, error: 'unlock' });
  }

  if (state.status === 'unlocked') {
    return children;
  }

  if (!state.hasProfile) {
    return (
      <EncryptionShell>
        <EncryptionSetupScreen
          isSubmitting={state.status === 'setup-submitting'}
          onSubmit={setup}
        />
      </EncryptionShell>
    );
  }

  return (
    <EncryptionShell>
      <EncryptionUnlockScreen
        hasUnlockError={state.status === 'error' && state.error === 'unlock'}
        isSubmitting={state.status === 'unlock-submitting'}
        onSubmit={unlock}
      />
    </EncryptionShell>
  );
}
