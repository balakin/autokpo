import { useEffect, useState } from 'react';

import { getStoredLocale } from '../i18n/locale-storage';

import { CrdtLocaleProvider } from './crdt-locale-provider';
import { bootstrap, createRuntime, type CrdtRuntime } from './doc';
import { DocContext } from './doc-context';
import { SyncMetadataProvider } from './sync-metadata-provider';
import { useSyncEngine } from './use-sync-engine';

export function CrdtProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const [runtime, setRuntime] = useState<CrdtRuntime | null>(null);

  useEffect(() => {
    let cancelled = false;
    const nextRuntime = createRuntime(userId);

    async function init() {
      await nextRuntime.whenReady;
      if (cancelled) return;
      bootstrap(nextRuntime.ydoc, getStoredLocale());
      setRuntime(nextRuntime);
    }

    void init();

    return () => {
      cancelled = true;
      setRuntime(null);
      void nextRuntime.destroy();
    };
  }, [userId]);

  if (runtime === null) return null;

  return (
    <DocContext value={runtime.ydoc}>
      <SyncMetadataProvider userId={userId}>
        <SyncEngine />
        <CrdtLocaleProvider>{children}</CrdtLocaleProvider>
      </SyncMetadataProvider>
    </DocContext>
  );
}

function SyncEngine() {
  useSyncEngine();
  return null;
}
