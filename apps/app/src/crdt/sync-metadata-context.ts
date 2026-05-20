import { createContext, use } from 'react';

import type { SyncStateStore } from './sync-state';

export const SyncMetadataStoreContext = createContext<SyncStateStore | null>(
  null,
);

export function useSyncMetadataStore(): SyncStateStore {
  const store = use(SyncMetadataStoreContext);
  if (store === null) {
    throw new Error(
      'useSyncMetadata must be used within SyncMetadataProvider.',
    );
  }
  return store;
}
