import { useEffect, useState } from 'react';

import { useEncryptionContext } from '../e2ee/encryption-context';
import { getStoredLocale } from '../i18n/locale-storage';

import { CrdtLocaleProvider } from './crdt-locale-provider';
import { bootstrap, createRuntime, type CrdtRuntime } from './doc';
import { DocContext } from './doc-context';
import { SyncMetadataProvider } from './sync-metadata-provider';
import { resetSyncState } from './sync-state';
import { useSyncEngine } from './use-sync-engine';

export function CrdtProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const { mek } = useEncryptionContext();
  const [runtime, setRuntime] = useState<CrdtRuntime | null>(null);

  useEffect(() => {
    let cancelled = false;
    const nextRuntime = createRuntime(userId, {
      mek,
      onReset: () => resetSyncState(userId),
    });

    async function init() {
      await nextRuntime.whenReady;
      if (cancelled) return;
      if (bootstrap(nextRuntime.ydoc, getStoredLocale())) {
        await nextRuntime.persistSnapshot();
      }
      if (cancelled) return;
      setRuntime(nextRuntime);
    }

    void init();

    return () => {
      cancelled = true;
      setRuntime(null);
      void nextRuntime.destroy();
    };
  }, [mek, userId]);

  if (runtime === null) return null;

  return (
    <DocContext value={runtime.ydoc}>
      <SyncMetadataProvider userId={userId}>
        <SyncEngine persistence={runtime.persistence} />
        <CrdtLocaleProvider>{children}</CrdtLocaleProvider>
      </SyncMetadataProvider>
    </DocContext>
  );
}

function SyncEngine({
  persistence,
}: {
  persistence: CrdtRuntime['persistence'];
}) {
  useSyncEngine(persistence);
  return null;
}
