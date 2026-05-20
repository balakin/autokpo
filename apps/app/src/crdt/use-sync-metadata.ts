import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';

import { shallowEqual } from '../utils/shallow-equal';

import { useSyncMetadataStore } from './sync-metadata-context';
import type { ParsedSyncState } from './sync-state';

export type SyncMetadata = Omit<ParsedSyncState, 'stateVector'>;

export function useSyncMetadata<T>(
  selector: (state: SyncMetadata) => T,
  isEqual?: (a: T, b: T) => boolean,
): T {
  const store = useSyncMetadataStore();

  function getSnapshot(): SyncMetadata {
    const state = store.read();
    return {
      cursor: state.cursor,
      dirty: state.dirty,
      lastSuccessfulSyncAt: state.lastSuccessfulSyncAt,
    };
  }

  return useSyncExternalStoreWithSelector(
    (callback) => store.subscribe(callback),
    getSnapshot,
    getSnapshot,
    selector,
    isEqual ?? shallowEqual,
  );
}
