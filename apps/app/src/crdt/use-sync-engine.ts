import type { QueryClient } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useAuth } from '../auth/use-auth';
import { useRequiredUserId } from '../auth/use-required-user-id';
import { useEncryptionContext } from '../e2ee/encryption-context';
import {
  createRotatedKeyRingPayload,
  type DekEntry,
} from '../e2ee/encryption-crypto';
import { useLeader } from '../leader';
import { createLogger } from '../utils/create-logger';

import { post, subscribe } from './bus';
import type { BusMessage } from './bus';
import type { EncryptedIndexeddbPersistence } from './encrypted-indexeddb-persistence';
import {
  SyncGoneError,
  SyncRequestError,
  compact as compactHttp,
  pull as pullHttp,
  push as pushHttp,
  type SyncRecord,
} from './sync-client';
import {
  REMOTE_ORIGIN,
  applyRecordsToDoc,
  computeDelta,
  decryptSyncPayload,
  encryptSyncPayload,
  hasPendingChanges,
  schedulePushIfPendingChanges,
} from './sync-logic';
import { useSyncMetadataStore } from './sync-metadata-context';
import { useDoc } from './use-doc';
import { applyUpdate, encodeStateAsUpdate, encodeStateVector } from './y';

const SYNC_QUERY_KEY = ['sync'] as const;
const STALE_TIME_MS = 5 * 60 * 1000;
const PUSH_DEBOUNCE_MS = 2 * 1000;
const MAX_PLAINTEXT_DELTA_BYTES = 1 * 1024 * 1024;

const log = createLogger('sync');

export function useSyncEngine(
  persistence?: EncryptedIndexeddbPersistence,
): void {
  const userId = useRequiredUserId();
  const auth = useAuth();
  const authRef = useRef(auth);
  authRef.current = auth;
  const queryClient = useQueryClient();
  const ydoc = useDoc();
  const { isLeader } = useLeader();
  const syncState = useSyncMetadataStore();
  const {
    mek,
    activeDek,
    activeDekId,
    keyRingId,
    keyRingRevision,
    deks,
    refreshKeyRingProfile,
    updateKeyRingProfile,
  } = useEncryptionContext();
  const isLeaderRef = useRef(isLeader);
  isLeaderRef.current = isLeader;
  const pushInFlightRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doPushRef = useRef<() => Promise<void>>(async () => {});
  const doCompactRef = useRef<(replacesUpTo: number) => Promise<void>>(
    async () => {},
  );
  const schedulePushRef = useRef<() => void>(() => {});
  const localUpdateQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingPushVersionRef = useRef(0);
  const persistenceRef = useRef(persistence);
  persistenceRef.current = persistence;
  const activeDekRef = useRef(activeDek);
  activeDekRef.current = activeDek;
  const activeDekIdRef = useRef(activeDekId);
  activeDekIdRef.current = activeDekId;
  const mekRef = useRef(mek);
  mekRef.current = mek;
  const keyRingIdRef = useRef(keyRingId);
  keyRingIdRef.current = keyRingId;
  const keyRingRevisionRef = useRef(keyRingRevision);
  keyRingRevisionRef.current = keyRingRevision;
  const deksRef = useRef(deks);
  deksRef.current = deks;
  const refreshKeyRingProfileRef = useRef(refreshKeyRingProfile);
  refreshKeyRingProfileRef.current = refreshKeyRingProfile;
  const updateKeyRingProfileRef = useRef(updateKeyRingProfile);
  updateKeyRingProfileRef.current = updateKeyRingProfile;

  const handleAuthFailureRef = useRef((error: unknown): boolean => {
    if (!(error instanceof SyncRequestError)) return false;
    const shouldLogout =
      error.status === 401 ||
      (error.status === 409 && error.code === 'local_user_mismatch');
    if (!shouldLogout) return false;
    void authRef.current.logout();
    return true;
  });

  async function decryptPulledRecordsWithFreshKeyRing(
    records: Awaited<ReturnType<typeof pullHttp>>['records'],
  ): Promise<Uint8Array[]> {
    if (records.length === 0) return [];
    try {
      return await decryptPulledRecords({
        records,
        deks: deksRef.current,
        keyRingRevision: keyRingRevisionRef.current,
        userId,
      });
    } catch (error) {
      if (!(error instanceof FutureKeyRingRevisionError)) throw error;
      const refreshed = await refreshKeyRingProfileRef.current();
      return decryptPulledRecords({
        records,
        deks: refreshed.deks,
        keyRingRevision: refreshed.revision,
        userId,
      });
    }
  }

  // --- Mutations ---

  const pushMutation = useMutation({
    mutationFn: ({
      delta,
      id,
      encryptionKeyId,
      keyRingRevision,
      encryptionAlgorithm,
      encryptionParams,
      localUserId,
    }: {
      delta: Uint8Array;
      id: string;
      encryptionKeyId: string;
      keyRingRevision: number;
      encryptionAlgorithm: 'aes-256-gcm';
      encryptionParams: { iv: Uint8Array; tagBits: number };
      localUserId: string;
    }) =>
      pushHttp({
        delta,
        id,
        encryptionKeyId,
        keyRingRevision,
        encryptionAlgorithm,
        encryptionParams,
        localUserId,
      }),
    retry: (count, err) => {
      if ((err as { status?: number })?.status === 413) return false;
      return count < 3;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  });

  const compactMutation = useMutation({
    mutationFn: ({
      snapshot,
      replacesUpTo,
      id,
      encryptionKeyId,
      keyRingRevision,
      encryptionAlgorithm,
      encryptionParams,
      localUserId,
    }: {
      snapshot: Uint8Array;
      replacesUpTo: number;
      id: string;
      encryptionKeyId: string;
      keyRingRevision: number;
      encryptionAlgorithm: 'aes-256-gcm';
      encryptionParams: { iv: Uint8Array; tagBits: number };
      localUserId: string;
    }) =>
      compactHttp({
        snapshot,
        replacesUpTo,
        id,
        encryptionKeyId,
        keyRingRevision,
        encryptionAlgorithm,
        encryptionParams,
        localUserId,
      }),
    retry: (count, err) => {
      if ((err as { status?: number })?.status === 413) return false;
      return count < 3;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  });

  // --- Pull query ---

  useQuery({
    queryKey: SYNC_QUERY_KEY,
    queryFn: async () => {
      if (!isLeaderRef.current) {
        // Ask the leader tab to pull — followers receive
        // updates via BroadcastChannel instead.
        post({ type: 'request-sync' });
        return 0;
      }

      const { cursor } = syncState.read();
      try {
        // Incremental pull: fetch only rows after our cursor.
        // Server returns 304 if nothing changed since cursor.
        log('pull: since=%d, dirty=%s', cursor, syncState.read().dirty);
        const result = await pullHttp({
          since: cursor,
          localUserId: userId,
        });
        log(
          'pull: got %d records, head=%d, status=%d',
          result.records.length,
          result.head,
          result.status,
        );
        const plaintexts = await decryptPulledRecordsWithFreshKeyRing(
          result.records,
        );
        await persistenceRef.current?.persistRemoteUpdates(plaintexts);
        // Apply all received records inside one Yjs transaction so
        // partial application is impossible.
        applyRecordsToDoc(ydoc, plaintexts);
        for (const plaintext of plaintexts) {
          post({ type: 'remote-update', bytes: plaintext });
        }
        // Re-read after async gap to avoid clobbering a concurrent
        // push that may have advanced cursor or set dirty. Preserve
        // the stored stateVector — pull only merges remote data,
        // it doesn't push our local changes.
        const { cursor: freshCursor, stateVector, dirty } = syncState.read();
        syncState.write({
          cursor: Math.max(result.head, freshCursor),
          stateVector,
          dirty,
          lastSuccessfulSyncAt: Date.now(),
        });
        schedulePushIfPendingChanges(syncState.read(), schedulePushRef.current);
        return result.head;
      } catch (err) {
        if (err instanceof SyncGoneError) {
          // 410 Gone: server no longer has rows from our cursor.
          // Wipe sync state (not Y.Doc!) and throw — React Query
          // will retry immediately. On retry, cursor=0 so we pull
          // from scratch. The doc merges the snapshot with local
          // offline edits; stateVector stays null so the next
          // push sends full state.
          log('pull: 410 gone, resetting sync state for immediate retry');
          syncState.reset();
        }
        if (!handleAuthFailureRef.current(err)) {
          throw err;
        }
        return cursor;
      }
    },
    // Manual invalidations (push, compact, bus, manual sync) bypass
    // staleTime, so this only throttles automatic refetches on focus
    // and reconnect.
    staleTime: STALE_TIME_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // 410 Gone: reset sync state and retry immediately (once).
    // cursor is now 0 so the retry pulls from scratch. All other
    // errors retry up to 3 times with exponential backoff.
    retry: (count, err) => {
      if (err instanceof SyncGoneError) return count < 1;
      return count < 3;
    },
    retryDelay: (count, err) =>
      err instanceof SyncGoneError ? 0 : Math.min(1000 * 2 ** count, 30000),
  });

  // --- Assign stable function refs inside effect to avoid render-time assignment ---

  useEffect(() => {
    schedulePushRef.current = () => {
      if (pushTimerRef.current !== null) {
        log('push: debounce reset');
        clearTimeout(pushTimerRef.current);
      }
      pushTimerRef.current = setTimeout(() => {
        pushTimerRef.current = null;
        void doPushRef.current();
      }, PUSH_DEBOUNCE_MS);
    };

    doPushRef.current = async () => {
      if (pushInFlightRef.current) return;
      // Dirty flag tracks whether local changes exist that
      // haven't been pushed yet (handles delete-only edits that
      // don't advance the state vector).
      if (!hasPendingChanges(syncState.read())) {
        log('push: no pending changes (dirty=%s)', syncState.read().dirty);
        return;
      }
      // Derive the delta since last acked state vector.
      // If stateVector is null (after 410 recovery), send full doc state.
      const { cursor } = syncState.read();
      const id = crypto.randomUUID();
      const plainDelta = computeDelta(ydoc, syncState.read().stateVector);
      // Delta too large for a single POST — compact instead.
      // Compact may pull afterwards if a gap is detected.
      if (plainDelta.byteLength > MAX_PLAINTEXT_DELTA_BYTES) {
        log(
          'push: delta %d bytes exceeds max, compacting',
          plainDelta.byteLength,
        );
        await doCompactRef.current(cursor);
        return;
      }
      const stateVector = encodeStateVector(ydoc);
      const pendingPushVersion = pendingPushVersionRef.current;
      const encryptionKeyId = activeDekIdRef.current;
      const preparedKeyRingRevision = keyRingRevisionRef.current;
      try {
        pushInFlightRef.current = true;
        const {
          encryptionAlgorithm,
          encryptionParams,
          ciphertext: encryptedDelta,
        } = await encryptSyncPayload({
          plaintext: plainDelta,
          activeDek: activeDekRef.current,
          userId,
          activeDekId: activeDekIdRef.current,
          keyRingRevision: keyRingRevisionRef.current,
          blockId: id,
          kind: 'update',
        });
        log(
          'push: delta=%d bytes, cursor=%d, dirty=%s',
          plainDelta.byteLength,
          cursor,
          syncState.read().dirty,
        );
        const result = await pushMutation.mutateAsync({
          delta: encryptedDelta,
          id,
          encryptionKeyId,
          keyRingRevision: preparedKeyRingRevision,
          encryptionAlgorithm,
          encryptionParams,
          localUserId: userId,
        });
        // "Push as poll": compute prevHead from the assigned seq.
        // Dense monotonic sequence means prevHead = assignedSeq - 1, no gaps.
        const prevHead = result.assignedSeq - 1;
        log(
          'push: assignedSeq=%d, prevHead=%d, cursor=%d, compactHint=%s',
          result.assignedSeq,
          prevHead,
          cursor,
          result.compactHint,
        );
        if (prevHead === cursor) {
          // No concurrent appends — our push is contiguous with
          // the server head. Re-read after async gap to avoid
          // clobbering concurrent writes. Clear dirty only if no
          // local/follower update arrived after this payload was prepared.
          const { cursor: freshCursor } = syncState.read();
          const dirty = pendingPushVersionRef.current !== pendingPushVersion;
          syncState.write({
            cursor: Math.max(result.assignedSeq, freshCursor),
            stateVector,
            dirty,
            lastSuccessfulSyncAt: Date.now(),
          });
          if (result.compactHint) {
            // Server flagged soft cap — compact to free storage.
            await doCompactRef.current(result.assignedSeq);
            return;
          } else {
            schedulePushIfPendingChanges(
              syncState.read(),
              schedulePushRef.current,
            );
          }
        } else {
          // Concurrent appends from other devices created a gap.
          // Pull to reconcile; the pull-success listener will
          // schedule push if there are pending local edits.
          log(
            'push: gap detected (prevHead=%d > cursor=%d), pulling',
            prevHead,
            cursor,
          );
          await queryClient.invalidateQueries({ queryKey: SYNC_QUERY_KEY });
        }
      } catch (error) {
        if (handleAuthFailureRef.current(error)) return;
        if (isWriteConflict(error)) {
          await refreshKeyRingProfileRef.current();
          await queryClient.invalidateQueries({ queryKey: SYNC_QUERY_KEY });
          return;
        }
        // React Query already retried (up to 3x with backoff).
        // On permanent failure (413) it stops. Transient
        // failures are retried. No manual reschedule here — the
        // next trigger (focus, reconnect, bus, local edit) will
        // re-derive the delta and start a fresh push cycle.
        log('push: failed after retries');
      } finally {
        pushInFlightRef.current = false;
      }
    };

    doCompactRef.current = async (replacesUpTo: number) => {
      const plainSnapshot = encodeStateAsUpdate(ydoc);
      const stateVector = encodeStateVector(ydoc);
      const pendingPushVersion = pendingPushVersionRef.current;
      const compactKey = await resolveCompactKey(keyRingRevisionRef.current);
      const id = crypto.randomUUID();
      const {
        encryptionAlgorithm,
        encryptionParams,
        ciphertext: encryptedSnapshot,
      } = await encryptSyncPayload({
        plaintext: plainSnapshot,
        activeDek: compactKey.activeDek,
        userId,
        activeDekId: compactKey.activeDekId,
        keyRingRevision: compactKey.revision,
        blockId: id,
        kind: 'snapshot',
      });
      const encryptionKeyId = compactKey.activeDekId;
      const preparedKeyRingRevision = compactKey.revision;
      log(
        'compact: replacesUpTo=%d, snapshot=%d bytes',
        replacesUpTo,
        plainSnapshot.byteLength,
      );
      try {
        const result = await compactMutation.mutateAsync({
          snapshot: encryptedSnapshot,
          replacesUpTo,
          id,
          encryptionKeyId,
          keyRingRevision: preparedKeyRingRevision,
          encryptionAlgorithm,
          encryptionParams,
          localUserId: userId,
        });
        // "Push as poll": the server assigns a dense monotonic seq,
        // so prevHead = assignedSeq - 1. If it matches our cursor,
        // no other device appended in between — we're contiguous.
        const prevHead = result.assignedSeq - 1;
        const { cursor } = syncState.read();
        log(
          'compact: assignedSeq=%d, prevHead=%d, cursor=%d, dirty=%s',
          result.assignedSeq,
          prevHead,
          cursor,
          syncState.read().dirty,
        );
        if (prevHead === cursor) {
          // Compact is contiguous with server head. Re-read after
          // async gap to avoid clobbering concurrent writes. Clear dirty only
          // if no local/follower update arrived after this snapshot was prepared.
          const { cursor: freshCursor } = syncState.read();
          const dirty = pendingPushVersionRef.current !== pendingPushVersion;
          syncState.write({
            cursor: Math.max(result.assignedSeq, freshCursor),
            stateVector,
            dirty,
            lastSuccessfulSyncAt: Date.now(),
          });
          schedulePushIfPendingChanges(
            syncState.read(),
            schedulePushRef.current,
          );
        } else {
          // Other devices appended rows between our last pull and
          // this compact, creating a gap. Pull to fetch those rows;
          // the pull-success listener will re-derive the delta and
          // schedule push if there are pending local edits.
          log(
            'compact: gap detected (prevHead=%d > cursor=%d), pulling',
            prevHead,
            cursor,
          );
          await queryClient.invalidateQueries({ queryKey: SYNC_QUERY_KEY });
        }
      } catch (error) {
        if (handleAuthFailureRef.current(error)) return;
        if (isWriteConflict(error)) {
          // A compact write conflict means this prepared snapshot was based on
          // stale sync/key-ring state. Do not retry it. Pull first; if local
          // dirty state still needs upload, the next push cycle will decide
          // whether compaction is still necessary.
          await queryClient.invalidateQueries({ queryKey: SYNC_QUERY_KEY });
          return;
        }
        log('compact: failed');
        // compact failed — will retry on next push cycle
      }
    };

    async function resolveCompactKey(basisRevision: number): Promise<{
      activeDek: Uint8Array;
      activeDekId: string;
      revision: number;
    }> {
      if (keyRingRevisionRef.current > basisRevision) {
        return {
          activeDek: activeDekRef.current,
          activeDekId: activeDekIdRef.current,
          revision: keyRingRevisionRef.current,
        };
      }

      const rotated = await createRotatedKeyRingPayload({
        keyRingId: keyRingIdRef.current,
        userId,
        mek: mekRef.current,
        currentRevision: keyRingRevisionRef.current,
        activeDekId: activeDekIdRef.current,
        deks: deksRef.current,
      });
      try {
        await updateKeyRingProfileRef.current(rotated.request);
        return {
          activeDek: rotated.activeDek,
          activeDekId: rotated.activeDekId,
          revision: rotated.revision,
        };
      } catch {
        const refreshed = await refreshKeyRingProfileRef.current();
        if (refreshed.revision <= basisRevision) {
          throw new Error('Refetched key ring is not newer than compact basis');
        }
        return {
          activeDek: refreshed.activeDek,
          activeDekId: refreshed.activeDekId,
          revision: refreshed.revision,
        };
      }
    }
  }, [userId, compactMutation, pushMutation, queryClient, syncState, ydoc]);

  // --- Cleanup push timer on unmount ---

  useEffect(() => {
    return () => {
      if (pushTimerRef.current !== null) {
        clearTimeout(pushTimerRef.current);
      }
    };
  }, []);

  // --- Yjs update listener ---

  useEffect(() => {
    function onYDocUpdate(update: Uint8Array, origin: unknown): void {
      if (origin === REMOTE_ORIGIN) return;
      pendingPushVersionRef.current += 1;
      log('ydoc: local update (%d bytes), dirty triggered', update.byteLength);
      localUpdateQueueRef.current = localUpdateQueueRef.current
        .then(async () => {
          await persistenceRef.current?.persistLocalUpdate(update);
          syncState.markDirty();
          post({ type: 'local-update', bytes: update });
          if (isLeaderRef.current) {
            schedulePushRef.current();
          }
        })
        .catch((error: unknown) => {
          log('ydoc: local persistence failed');
          if (!handleAuthFailureRef.current(error)) {
            // Keep the side-effect queue usable; local persistence performs
            // its own cache reset/recovery on write failures.
          }
        });
    }
    ydoc.on('update', onYDocUpdate);
    return () => {
      ydoc.off('update', onYDocUpdate);
    };
  }, [syncState, ydoc]);

  // --- Bus listener ---

  useEffect(() => {
    function onBusMessage(msg: BusMessage): void {
      switch (msg.type) {
        case 'local-update': {
          log('bus: local-update (%d bytes)', msg.bytes.byteLength);
          pendingPushVersionRef.current += 1;
          applyUpdate(ydoc, msg.bytes, REMOTE_ORIGIN);
          if (isLeaderRef.current) {
            schedulePushRef.current();
          }
          break;
        }
        case 'remote-update': {
          log('bus: remote-update (%d bytes)', msg.bytes.byteLength);
          applyUpdate(ydoc, msg.bytes, REMOTE_ORIGIN);
          break;
        }
        case 'request-sync': {
          log('bus: request-sync');
          if (isLeaderRef.current) {
            void queryClient.invalidateQueries({ queryKey: SYNC_QUERY_KEY });
          }
          break;
        }
      }
    }
    return subscribe(onBusMessage);
  }, [queryClient, ydoc]);

  useEffect(() => {
    if (!isLeader) return;
    void queryClient.invalidateQueries({ queryKey: SYNC_QUERY_KEY });
  }, [isLeader, queryClient]);
}

class FutureKeyRingRevisionError extends Error {
  requiredRevision: number;

  constructor(requiredRevision: number) {
    super('Pulled sync row references a future key-ring revision');
    this.name = 'FutureKeyRingRevisionError';
    this.requiredRevision = requiredRevision;
  }
}

async function decryptPulledRecords({
  records,
  deks,
  keyRingRevision,
  userId,
}: {
  records: SyncRecord[];
  deks: Record<string, DekEntry>;
  keyRingRevision: number;
  userId: string;
}): Promise<Uint8Array[]> {
  const requiredRevision = Math.max(
    keyRingRevision,
    ...records.map((record) => record.keyRingRevision),
  );
  if (requiredRevision > keyRingRevision) {
    throw new FutureKeyRingRevisionError(requiredRevision);
  }

  return Promise.all(
    records.map((record) => {
      const dekEntry = deks[record.encryptionKeyId];
      if (!dekEntry) {
        throw new Error('Missing DEK for pulled sync row');
      }
      return decryptSyncPayload({
        payload: {
          encryptionAlgorithm: record.encryptionAlgorithm,
          encryptionParams: record.encryptionParams,
          ciphertext: record.ciphertext,
        },
        activeDek: dekEntry.key,
        userId,
        activeDekId: record.encryptionKeyId,
        keyRingRevision: record.keyRingRevision,
        blockId: record.id,
        kind: record.kind,
      });
    }),
  );
}

function isWriteConflict(error: unknown): boolean {
  return (
    error instanceof SyncRequestError &&
    error.status === 409 &&
    error.code === 'write_conflict'
  );
}

export function triggerSync(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: SYNC_QUERY_KEY });
}
