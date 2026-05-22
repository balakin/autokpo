import { Button, Card, Spinner } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import { useEffect, useReducer, useState, type ReactNode } from 'react';

import { EncryptionContext } from './encryption-context';
import { createWrappedMasterKey, unwrapMasterKey } from './encryption-crypto';
import {
  createInitialEncryptionGateState,
  encryptionGateReducer,
} from './encryption-gate-reducer';
import {
  createEncryptionKeyRecord,
  EncryptionKeyNotFoundError,
  fetchEncryptionKeyRecord,
} from './encryption-key-api';
import {
  readCachedEncryptionKeyRecord,
  writeCachedEncryptionKeyRecord,
} from './encryption-key-cache';
import { EncryptionSetupScreen } from './encryption-setup-screen';
import { EncryptionShell } from './encryption-shell';
import { EncryptionUnlockScreen } from './encryption-unlock-screen';

type EncryptionGateProps = {
  userId: string;
  children: ReactNode;
};

export function EncryptionGate({ userId, children }: EncryptionGateProps) {
  return (
    <EncryptionGateForUser key={userId} userId={userId}>
      {children}
    </EncryptionGateForUser>
  );
}

function EncryptionGateForUser({ userId, children }: EncryptionGateProps) {
  const [gateState, dispatch] = useReducer(
    encryptionGateReducer,
    userId,
    createInitialEncryptionGateState,
  );
  const session = gateState.session;

  useEffect(() => {
    if (session.status !== 'checking') return;
    let cancelled = false;
    void fetchEncryptionKeyRecord()
      .then((record) => {
        if (cancelled) return;
        writeCachedEncryptionKeyRecord(userId, record);
        dispatch({ type: 'check-succeeded' });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (isEncryptionKeyNotFoundError(error)) {
          dispatch({ type: 'check-missing' });
          return;
        }
        dispatch({ type: 'check-failed' });
      });
    return () => {
      cancelled = true;
    };
  }, [session.status, userId]);

  async function setup(password: string) {
    dispatch({ type: 'setup-submitted' });
    try {
      const { request, masterKey } = await createWrappedMasterKey(
        userId,
        password,
      );
      const record = await createEncryptionKeyRecord(request);
      writeCachedEncryptionKeyRecord(userId, record);
      dispatch({ type: 'unlocked', masterKey, keyId: record.key.id });
    } catch {
      dispatch({ type: 'setup-failed' });
    }
  }

  async function unlock(password: string) {
    dispatch({ type: 'unlock-submitted' });
    try {
      const record =
        readCachedEncryptionKeyRecord(userId) ??
        (await fetchEncryptionKeyRecord());
      writeCachedEncryptionKeyRecord(userId, record);
      const masterKey = await unwrapMasterKey(password, record);
      dispatch({ type: 'unlocked', masterKey, keyId: record.key.id });
      return;
    } catch {
      dispatch({ type: 'unlock-failed' });
    }
  }

  if (session.status === 'unlocked' && gateState.masterKey && gateState.keyId) {
    return (
      <EncryptionContext
        value={{ masterKey: gateState.masterKey, keyId: gateState.keyId }}
      >
        {children}
      </EncryptionContext>
    );
  }

  if (session.status === 'checking') {
    return <EncryptionGateLoading />;
  }

  if (session.status === 'error' && session.error === 'check') {
    return (
      <EncryptionShell>
        <Card className="w-full max-w-md gap-4 border-border bg-surface/90 p-5 shadow-overlay backdrop-blur-sm sm:p-6">
          <Card.Header className="gap-1 p-0">
            <Card.Title className="text-2xl/tight font-bold tracking-tight">
              <Trans>Ne možemo da proverimo šifrovanje</Trans>
            </Card.Title>
            <Card.Description className="text-base/6">
              <Trans>
                Proverite internet vezu i pokušajte ponovo. Nećemo praviti novi
                ključ dok ne proverimo postojeće podešavanje naloga.
              </Trans>
            </Card.Description>
          </Card.Header>
          <Card.Content className="p-0 pt-2">
            <Button
              fullWidth
              size="lg"
              variant="secondary"
              onPress={() => dispatch({ type: 'retry-check' })}
            >
              <Trans>Pokušaj ponovo</Trans>
            </Button>
          </Card.Content>
        </Card>
      </EncryptionShell>
    );
  }

  if (!session.hasProfile) {
    return (
      <EncryptionShell>
        <EncryptionSetupScreen
          isSubmitting={session.status === 'setup-submitting'}
          onSubmit={(password) => void setup(password)}
        />
      </EncryptionShell>
    );
  }

  return (
    <EncryptionShell>
      <EncryptionUnlockScreen
        hasUnlockError={
          session.status === 'error' && session.error === 'unlock'
        }
        isSubmitting={session.status === 'unlock-submitting'}
        onSubmit={(password) => void unlock(password)}
      />
    </EncryptionShell>
  );
}

function EncryptionGateLoading() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsVisible(true), 250);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="grid min-h-screen place-items-center bg-background text-muted">
      <Spinner color="current" size="sm" />
    </div>
  );
}

function isEncryptionKeyNotFoundError(
  error: unknown,
): error is EncryptionKeyNotFoundError {
  return (
    error instanceof EncryptionKeyNotFoundError ||
    (error instanceof Error && error.name === 'EncryptionKeyNotFoundError')
  );
}
