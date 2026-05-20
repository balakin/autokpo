import { useEffect, useRef, type ReactNode } from 'react';

import { SyncMetadataStoreContext } from './sync-metadata-context';
import { createSyncStateStore } from './sync-state';

export function SyncMetadataProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const storeRef = useRef<{
    userId: string;
    store: ReturnType<typeof createSyncStateStore>;
  } | null>(null);

  if (storeRef.current === null) {
    storeRef.current = { userId, store: createSyncStateStore(userId) };
  }

  if (storeRef.current.userId !== userId) {
    storeRef.current.store.destroy();
    storeRef.current = { userId, store: createSyncStateStore(userId) };
  }

  useEffect(() => {
    return () => {
      storeRef.current?.store.destroy();
      storeRef.current = null;
    };
  }, []);

  return (
    <SyncMetadataStoreContext value={storeRef.current.store}>
      {children}
    </SyncMetadataStoreContext>
  );
}
