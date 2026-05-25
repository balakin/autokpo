import { Button, Card, Spinner } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import { useEffect, useReducer, useState, type ReactNode } from 'react';

import { aesGcmDecrypt } from './aes-gcm';
import { base64ToBytes } from './base64';
import { EncryptionContext } from './encryption-context';
import {
  createKeyRingProfilePayload,
  decryptKeyRingWithMek,
  EncryptionUnlockError,
  generateLdk,
  unwrapKeyRingProfile,
  unwrapMekWithLdk,
  unwrapMekWithPin,
  wrapMekWithLdk,
  wrappedMekAad,
} from './encryption-crypto';
import {
  createInitialEncryptionGateState,
  encryptionGateReducer,
} from './encryption-gate-reducer';
import { EncryptionSetupScreen } from './encryption-setup-screen';
import { EncryptionShell } from './encryption-shell';
import { EncryptionUnlockScreen } from './encryption-unlock-screen';
import { deriveKek } from './kdf';
import {
  createKeyRingProfile,
  fetchKeyRingProfile,
  KeyRingNotFoundError,
} from './key-ring-api';
import type { SerializedKeyRingProfile } from './key-ring-record';
import {
  KeysIndexeddb,
  type KeyRingRecord,
  type LocalWrapperRecordPin,
  type WrapperRecord,
} from './keys-indexeddb';
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
      let keyRingRecord: KeyRingRecord;

      try {
        const profile = await fetchKeyRingProfile();
        if (cancelled) return;
        const kr = keyRingRecordFromProfile(profile, userId);
        const wr = wrapperRecordFromProfile(profile, userId);
        await s.writeKeyRing(kr);
        if (wr) await s.writeWrapper(wr);
        keyRingRecord = kr;
      } catch (error: unknown) {
        if (cancelled) return;
        if (isKeyRingNotFoundError(error)) {
          dispatch({ type: 'check-missing' });
          return;
        }
        if (isNetworkLikeError(error)) {
          const cached = await s.readKeyRing(userId);
          if (!cached) {
            dispatch({ type: 'check-failed' });
            return;
          }
          keyRingRecord = cached;
        } else {
          dispatch({ type: 'check-failed' });
          return;
        }
      }

      if (cancelled) return;

      const localWrapper = await s.readLocalWrapper(userId);
      if (localWrapper?.method === 'ldk') {
        try {
          const mek = await unwrapMekWithLdk(
            localWrapper.ciphertext,
            localWrapper.wrappingIv,
            localWrapper.ldk,
            userId,
            localWrapper.wrapperId,
          );
          const { activeDek, activeDekId } = await decryptKeyRingWithMek(
            mek,
            keyRingRecord,
          );
          if (cancelled) return;
          dispatch({ type: 'unlocked', mek, activeDek, activeDekId });
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
  }, [session.status, userId, store]);

  async function setup(password: string) {
    if (!store) return;
    dispatch({ type: 'setup-submitted' });
    try {
      const { request, mek, activeDek, activeDekId } =
        await createKeyRingProfilePayload(userId, password);
      const profile = await createKeyRingProfile(request);
      await store.writeKeyRing(keyRingRecordFromProfile(profile, userId));
      const wr = wrapperRecordFromProfile(profile, userId);
      if (wr) await store.writeWrapper(wr);
      await storeLdkWrapper(store, mek, userId);
      dispatch({ type: 'unlocked', mek, activeDek, activeDekId });
    } catch {
      dispatch({ type: 'setup-failed' });
    }
  }

  async function unlock(password: string) {
    if (!store) return;
    dispatch({ type: 'unlock-submitted' });
    try {
      let profile: SerializedKeyRingProfile | null = null;
      try {
        profile = await fetchKeyRingProfile();
      } catch (error) {
        if (!isNetworkLikeError(error)) throw error;
      }

      let mek: Uint8Array;
      let activeDek: Uint8Array;
      let activeDekId: string;

      if (profile) {
        await store.writeKeyRing(keyRingRecordFromProfile(profile, userId));
        const wr = wrapperRecordFromProfile(profile, userId);
        if (wr) await store.writeWrapper(wr);
        ({ mek, activeDek, activeDekId } = await unwrapKeyRingProfile(
          password,
          profile,
        ));
      } else {
        const keyRingRecord = await store.readKeyRing(userId);
        const wrapperRecord = await store.readWrapper(userId);
        if (!keyRingRecord || !wrapperRecord) {
          throw new Error('No cached key ring available');
        }
        ({ mek, activeDek, activeDekId } = await unlockWithLocalRecords(
          password,
          userId,
          keyRingRecord,
          wrapperRecord,
        ));
      }

      await storeLdkWrapper(store, mek, userId);
      dispatch({ type: 'unlocked', mek, activeDek, activeDekId });
    } catch {
      dispatch({ type: 'unlock-failed' });
    }
  }

  async function unlockWithPin(pin: string) {
    if (!store || !pinWrapper) return;
    dispatch({ type: 'unlock-submitted' });
    try {
      const mek = await unwrapMekWithPin(pinWrapper, pin);
      const keyRingRecord = await store.readKeyRing(userId);
      if (!keyRingRecord) throw new EncryptionUnlockError();
      const { activeDek, activeDekId } = await decryptKeyRingWithMek(
        mek,
        keyRingRecord,
      );
      await store.updatePinFailedAttempts(userId, 0);
      dispatch({ type: 'unlocked', mek, activeDek, activeDekId });
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
    if (!store) return;
    const profile = await fetchKeyRingProfile();
    await store.writeKeyRing(keyRingRecordFromProfile(profile, userId));
    const wr = wrapperRecordFromProfile(profile, userId);
    if (wr) await store.writeWrapper(wr);
  }

  if (
    session.status === 'unlocked' &&
    gateState.mek &&
    gateState.activeDek &&
    gateState.activeDekId
  ) {
    return (
      <EncryptionContext
        value={{
          mek: gateState.mek,
          activeDek: gateState.activeDek,
          activeDekId: gateState.activeDekId,
          clearEncryptionSession: () => dispatch({ type: 'clear-session' }),
          refreshKeyRingProfile: refreshKeyRingProfileCache,
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

function keyRingRecordFromProfile(
  profile: SerializedKeyRingProfile,
  userId: string,
): KeyRingRecord {
  return {
    userId,
    keyRingId: profile.keyRing.id,
    activeDekId: profile.keyRing.activeDekId,
    encryptionVersion: profile.keyRing.encryptionVersion,
    encryptionAlgorithm: profile.keyRing.encryptionAlgorithm,
    iv: profile.keyRing.iv,
    ciphertext: profile.keyRing.ciphertext,
    createdAt: profile.keyRing.createdAt,
    updatedAt: profile.keyRing.updatedAt,
  };
}

function wrapperRecordFromProfile(
  profile: SerializedKeyRingProfile,
  userId: string,
): WrapperRecord | null {
  const wrapper = profile.wrappers.find((w) => w.method === 'password');
  if (!wrapper) return null;
  return {
    userId,
    method: 'password',
    wrappingId: wrapper.id,
    ciphertext: base64ToBytes(wrapper.ciphertext),
    wrappingIv: base64ToBytes(wrapper.wrappingIv),
    wrappingAlgorithm: 'aes-256-gcm',
    wrappingVersion: 1,
    kdfAlgorithm: 'argon2id',
    kdfVersion: 1,
    kdfParams: wrapper.kdfParams,
    kdfSalt: base64ToBytes(wrapper.kdfSalt),
    createdAt: wrapper.createdAt,
  };
}

async function unlockWithLocalRecords(
  password: string,
  userId: string,
  keyRingRecord: KeyRingRecord,
  wrapperRecord: WrapperRecord,
): Promise<{ mek: Uint8Array; activeDek: Uint8Array; activeDekId: string }> {
  try {
    const kek = await deriveKek(
      password,
      wrapperRecord.kdfSalt,
      wrapperRecord.kdfParams,
    );
    const mek = await aesGcmDecrypt({
      keyBytes: kek,
      iv: wrapperRecord.wrappingIv,
      ciphertext: wrapperRecord.ciphertext,
      aad: wrappedMekAad(userId, wrapperRecord.wrappingId, 'password'),
    });
    const { activeDek, activeDekId } = await decryptKeyRingWithMek(
      mek,
      keyRingRecord,
    );
    return { mek, activeDek, activeDekId };
  } catch {
    throw new EncryptionUnlockError();
  }
}

async function storeLdkWrapper(
  store: KeysIndexeddb,
  mek: Uint8Array,
  userId: string,
): Promise<void> {
  try {
    const ldk = await generateLdk();
    const wrapperId = crypto.randomUUID();
    const { ciphertext, iv } = await wrapMekWithLdk(
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
      wrappingIv: iv,
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

function isNetworkLikeError(error: unknown): boolean {
  return error instanceof TypeError || !navigator.onLine;
}
