import { Button, Card, Spinner } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useReducer, useState, type ReactNode } from 'react';

import { EncryptionContext } from './encryption-context';
import {
  createKeyRingProfilePayload,
  decryptKeyRingWithMek,
  type DecryptedKeyRing,
  type DekEntry,
  generateLdk,
  unwrapKeyRingProfile,
  unwrapMekWithLdk,
  unwrapMekWithPin,
  wrapMekWithLdk,
} from './encryption-crypto';
import {
  createInitialEncryptionGateState,
  encryptionGateReducer,
} from './encryption-gate-reducer';
import { EncryptionSetupScreen } from './encryption-setup-screen';
import { EncryptionShell } from './encryption-shell';
import { EncryptionUnlockScreen } from './encryption-unlock-screen';
import {
  createKeyRingProfile,
  KeyRingConflictError,
  KeyRingNotFoundError,
  updateKeyRingProfile,
} from './key-ring-api';
import {
  cacheKeyRingProfile,
  keyRingProfileQueryOptions,
} from './key-ring-query';
import type { UpdateKeyRingRequest } from './key-ring-record';
import { KeysIndexeddb, type LocalWrapperRecordPin } from './keys-indexeddb';
import { PinUnlockScreen } from './pin-unlock-screen';

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
  const queryClient = useQueryClient();
  const [store, setStore] = useState<KeysIndexeddb | null>(null);
  const [pinWrapper, setPinWrapper] = useState<LocalWrapperRecordPin | null>(
    null,
  );
  const [pinWiped, setPinWiped] = useState(false);

  const [gateState, dispatch] = useReducer(
    encryptionGateReducer,
    userId,
    createInitialEncryptionGateState,
  );
  const session = gateState.session;

  useEffect(() => {
    let cancelled = false;
    const db = new KeysIndexeddb();
    void db.whenReady.then(() => {
      if (!cancelled) setStore(db);
    });
    return () => {
      cancelled = true;
      db.close();
      setStore(null);
    };
  }, []);

  useEffect(() => {
    if (!store || session.status !== 'checking') return;
    const s = store;
    let cancelled = false;

    async function check() {
      let profile;

      try {
        profile = await queryClient.fetchQuery(
          keyRingProfileQueryOptions(userId),
        );
      } catch (error: unknown) {
        if (cancelled) return;
        if (isKeyRingNotFoundError(error)) {
          dispatch({ type: 'check-missing' });
          return;
        }
        dispatch({ type: 'check-failed' });
        return;
      }

      if (cancelled) return;

      const localWrapper = await s.readLocalWrapper(userId);
      if (localWrapper?.method === 'ldk') {
        try {
          const mek = await unwrapMekWithLdk(
            localWrapper.ciphertext,
            localWrapper.wrappingParams,
            localWrapper.ldk,
            userId,
            localWrapper.wrapperId,
          );
          const decrypted = await decryptKeyRingWithMek(mek, profile.keyRing);
          if (cancelled) return;
          dispatch({
            type: 'unlocked',
            mek,
            keyRingId: profile.keyRing.id,
            ...toUnlockedAction(decrypted),
          });
          return;
        } catch {
          await s.deleteLocalWrapper(userId);
        }
      }

      if (localWrapper?.method === 'pin') {
        if (cancelled) return;
        setPinWrapper(localWrapper);
        dispatch({ type: 'check-succeeded' });
        return;
      }

      if (cancelled) return;
      dispatch({ type: 'check-succeeded' });
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [session.status, userId, store, queryClient]);

  async function setup(password: string) {
    if (!store) return;
    dispatch({ type: 'setup-submitted' });
    try {
      const { request, mek, activeDek, activeDekId, revision, deks } =
        await createKeyRingProfilePayload(userId, password);
      const profile = await createKeyRingProfile(request);
      await cacheKeyRingProfile(queryClient, userId, profile);
      await storeLdkWrapper(store, mek, userId);
      dispatch({
        type: 'unlocked',
        mek,
        activeDek,
        activeDekId,
        keyRingId: profile.keyRing.id,
        keyRingRevision: revision,
        deks,
      });
    } catch {
      dispatch({ type: 'setup-failed' });
    }
  }

  async function unlock(password: string) {
    if (!store) return;
    dispatch({ type: 'unlock-submitted' });
    try {
      const profile = await queryClient.fetchQuery(
        keyRingProfileQueryOptions(userId),
      );

      const {
        mek,
        activeDek,
        activeDekId,
        revision: keyRingRevision,
        deks,
      } = await unwrapKeyRingProfile(password, profile);

      await storeLdkWrapper(store, mek, userId);
      dispatch({
        type: 'unlocked',
        mek,
        activeDek,
        activeDekId,
        keyRingId: profile.keyRing.id,
        keyRingRevision,
        deks,
      });
    } catch {
      dispatch({ type: 'unlock-failed' });
    }
  }

  async function unlockWithPin(pin: string) {
    if (!store || !pinWrapper) return;
    dispatch({ type: 'unlock-submitted' });
    try {
      const mek = await unwrapMekWithPin(pinWrapper, pin);
      const profile = await queryClient.fetchQuery(
        keyRingProfileQueryOptions(userId),
      );
      const { activeDek, activeDekId, revision, deks } =
        await decryptKeyRingWithMek(mek, profile.keyRing);
      await store.updatePinFailedAttempts(userId, 0);
      dispatch({
        type: 'unlocked',
        mek,
        activeDek,
        activeDekId,
        keyRingId: profile.keyRing.id,
        keyRingRevision: revision,
        deks,
      });
    } catch {
      const nextCount = pinWrapper.failedAttempts + 1;
      if (nextCount >= 10) {
        await store.deleteLocalWrapper(userId);
        setPinWrapper(null);
        setPinWiped(true);
      } else {
        await store.updatePinFailedAttempts(userId, nextCount);
        setPinWrapper({ ...pinWrapper, failedAttempts: nextCount });
      }
      dispatch({ type: 'unlock-failed' });
    }
  }

  async function refreshKeyRingProfileCache() {
    if (!gateState.mek) throw new Error('Key ring store is not ready');
    const profile = await queryClient.fetchQuery({
      ...keyRingProfileQueryOptions(userId),
      staleTime: 0,
    });
    const decrypted = await decryptKeyRingWithMek(
      gateState.mek,
      profile.keyRing,
    );
    dispatch({
      type: 'unlocked',
      mek: gateState.mek,
      keyRingId: profile.keyRing.id,
      ...toUnlockedAction(decrypted),
    });
    return decrypted;
  }

  async function updateKeyRingProfileCache(request: UpdateKeyRingRequest) {
    try {
      const profile = await updateKeyRingProfile(request);
      await cacheKeyRingProfile(queryClient, userId, profile);
      if (gateState.mek) {
        const decrypted = await decryptKeyRingWithMek(
          gateState.mek,
          profile.keyRing,
        );
        dispatch({
          type: 'unlocked',
          mek: gateState.mek,
          keyRingId: profile.keyRing.id,
          ...toUnlockedAction(decrypted),
        });
      }
      return profile;
    } catch (error) {
      if (isKeyRingConflictError(error)) {
        await queryClient.fetchQuery({
          ...keyRingProfileQueryOptions(userId),
          staleTime: 0,
        });
      }
      throw error;
    }
  }

  if (
    session.status === 'unlocked' &&
    gateState.mek &&
    gateState.activeDek &&
    gateState.activeDekId &&
    gateState.keyRingId &&
    gateState.keyRingRevision !== null &&
    gateState.deks
  ) {
    return (
      <EncryptionContext
        value={{
          mek: gateState.mek,
          activeDek: gateState.activeDek,
          activeDekId: gateState.activeDekId,
          keyRingId: gateState.keyRingId,
          keyRingRevision: gateState.keyRingRevision,
          deks: gateState.deks,
          getDek: (dekId) => gateState.deks?.[dekId]?.key ?? null,
          clearEncryptionSession: () => dispatch({ type: 'clear-session' }),
          refreshKeyRingProfile: refreshKeyRingProfileCache,
          updateKeyRingProfile: updateKeyRingProfileCache,
        }}
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

  if (pinWrapper && !pinWiped) {
    return (
      <EncryptionShell>
        <PinUnlockScreen
          failedAttempts={pinWrapper.failedAttempts}
          hasUnlockError={
            session.status === 'error' && session.error === 'unlock'
          }
          isSubmitting={session.status === 'unlock-submitting'}
          onSubmit={(pin) => void unlockWithPin(pin)}
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
        pinWiped={pinWiped}
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

function toUnlockedAction(decrypted: DecryptedKeyRing): {
  activeDek: Uint8Array;
  activeDekId: string;
  keyRingRevision: number;
  deks: Record<string, DekEntry>;
} {
  return {
    activeDek: decrypted.activeDek,
    activeDekId: decrypted.activeDekId,
    keyRingRevision: decrypted.revision,
    deks: decrypted.deks,
  };
}

async function storeLdkWrapper(
  store: KeysIndexeddb,
  mek: Uint8Array,
  userId: string,
): Promise<void> {
  try {
    const ldk = await generateLdk();
    const wrapperId = crypto.randomUUID();
    const { ciphertext, wrappingParams } = await wrapMekWithLdk(
      mek,
      ldk,
      userId,
      wrapperId,
    );
    await store.writeLocalWrapper({
      userId,
      method: 'ldk',
      wrapperId,
      ldk,
      ciphertext,
      wrappingAlgorithm: 'aes-256-gcm',
      wrappingParams,
    });
  } catch {
    // LDK storage failure is non-fatal — user will be prompted on next session.
  }
}

function isKeyRingNotFoundError(error: unknown): error is KeyRingNotFoundError {
  return (
    error instanceof KeyRingNotFoundError ||
    (error instanceof Error && error.name === 'KeyRingNotFoundError')
  );
}

function isKeyRingConflictError(error: unknown): error is KeyRingConflictError {
  return (
    error instanceof KeyRingConflictError ||
    (error instanceof Error && error.name === 'KeyRingConflictError')
  );
}
