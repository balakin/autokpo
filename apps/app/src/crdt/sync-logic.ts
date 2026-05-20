import type { SyncRecord } from './sync-client';
import type { ParsedSyncState } from './sync-state';
import type { TypedDoc } from './typed-doc';
import { applyUpdate, encodeStateAsUpdate } from './y';

export const REMOTE_ORIGIN = Symbol('autokpo:remote');

export function hasPendingChanges(state: ParsedSyncState): boolean {
  if (state.stateVector === null) return true;
  return state.dirty;
}

export function computeDelta(
  doc: TypedDoc,
  stateVector: Uint8Array | null,
): Uint8Array<ArrayBuffer> {
  return stateVector === null
    ? encodeStateAsUpdate(doc)
    : encodeStateAsUpdate(doc, stateVector);
}

export function applyRecordsToDoc(doc: TypedDoc, records: SyncRecord[]): void {
  if (records.length === 0) return;
  doc.transact(() => {
    for (const record of records) {
      applyUpdate(doc, record.bytes, REMOTE_ORIGIN);
    }
  }, REMOTE_ORIGIN);
}

export function schedulePushIfPendingChanges(
  state: ParsedSyncState,
  schedulePush: () => void,
): void {
  if (hasPendingChanges(state)) {
    schedulePush();
  }
}
