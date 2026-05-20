import type { QueryClient } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useAuth } from '../auth/use-auth';
import { useRequiredUserId } from '../auth/use-required-user-id';
import { useLeader } from '../leader';
import { createLogger } from '../utils/create-logger';

import { post, subscribe } from './bus';
import type { BusMessage } from './bus';
import {
  SyncGoneError,
  SyncRequestError,
  compact as compactHttp,
  pull as pullHttp,
  push as pushHttp,
} from './sync-client';
import {
  REMOTE_ORIGIN,
  applyRecordsToDoc,
  computeDelta,
  hasPendingChanges,
  schedulePushIfPendingChanges,
} from './sync-logic';
import { useSyncMetadataStore } from './sync-metadata-context';
import { useDoc } from './use-doc';
import { applyUpdate, encodeStateAsUpdate, encodeStateVector } from './y';

const SYNC_QUERY_KEY = ['sync'] as const;
const STALE_TIME_MS = 5 * 60 * 1000;
const PUSH_DEBOUNCE_MS = 2 * 1000;
const MAX_BLOB_BYTES = 1 * 1024 * 1024;

const log = createLogger('sync');

export function useSyncEngine(): void {
  const userId = useRequiredUserId();
  const auth = useAuth();
  const authRef = useRef(auth);
  authRef.current = auth;
  const queryClient = useQueryClient();
  const ydoc = useDoc();
  const { isLeader } = useLeader();
  const syncState = useSyncMetadataStore();
  const isLeaderRef = useRef(isLeader);
  isLeaderRef.current = isLeader;
  const pushInFlightRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doPushRef = useRef<() => Promise<void>>(async () => {});
  const doCompactRef = useRef<(replacesUpTo: number) => Promise<void>>(
    async () => {},
  );
  const schedulePushRef = useRef<() => void>(() => {});

  const handleAuthFailureRef = useRef((error: unknown): boolean => {
    if (!(error instanceof SyncRequestError)) return false;
    const shouldLogout =
      error.status === 401 ||
      (error.status === 409 && error.code === 'local_user_mismatch');
    if (!shouldLogout) return false;
    void authRef.current.logout();
    return true;
  });

  // --- Mutations ---

  const pushMutation = useMutation({
    mutationFn: ({
      delta,
      idempotencyKey,
      localUserId,
    }: {
      delta: Uint8Array<ArrayBuffer>;
      idempotencyKey: string;
      localUserId: string;
    }) => pushHttp({ delta, idempotencyKey, localUserId }),
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
      idempotencyKey,
      localUserId,
    }: {
      snapshot: Uint8Array<ArrayBuffer>;
      replacesUpTo: number;
      idempotencyKey: string;
      localUserId: string;
    }) => compactHttp({ snapshot, replacesUpTo, idempotencyKey, localUserId }),
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
        // Apply all received records inside one Yjs transaction so
        // partial application is impossible.
        applyRecordsToDoc(ydoc, result.records);
        for (const record of result.records) {
          post({ type: 'remote-update', bytes: record.bytes });
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

    doCompactRef.current = async (replacesUpTo: number) => {
      const snapshot = encodeStateAsUpdate(ydoc);
      const idempotencyKey = crypto.randomUUID();
      log(
        'compact: replacesUpTo=%d, snapshot=%d bytes',
        replacesUpTo,
        snapshot.byteLength,
      );
      try {
        const result = await compactMutation.mutateAsync({
          snapshot,
          replacesUpTo,
          idempotencyKey,
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
          // async gap to avoid clobbering concurrent writes.
          const { cursor: freshCursor, dirty } = syncState.read();
          syncState.write({
            cursor: Math.max(result.assignedSeq, freshCursor),
            stateVector: encodeStateVector(ydoc),
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
        log('compact: failed');
        // compact failed — will retry on next push cycle
      }
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
      const delta = computeDelta(ydoc, syncState.read().stateVector);
      // Delta too large for a single POST — compact instead.
      // Compact may pull afterwards if a gap is detected.
      if (delta.byteLength > MAX_BLOB_BYTES) {
        log('push: delta %d bytes exceeds max, compacting', delta.byteLength);
        await doCompactRef.current(cursor);
        return;
      }
      const idempotencyKey = crypto.randomUUID();
      log(
        'push: delta=%d bytes, cursor=%d, dirty=%s',
        delta.byteLength,
        cursor,
        syncState.read().dirty,
      );
      pushInFlightRef.current = true;
      try {
        const result = await pushMutation.mutateAsync({
          delta,
          idempotencyKey,
          localUserId: userId,
        });
        // "Push as poll": compute prevHead from the assigned seq.
        // Dense monotonic sequence means prevHead = assignedSeq - 1, no gaps.
        const prevHead = result.assignedSeq - 1;
        log(
          'push: assignedSeq=%d, prevHead=%d, cursor=%d, compactHint=%s, dirty=%s',
          result.assignedSeq,
          prevHead,
          cursor,
          result.compactHint,
          syncState.read().dirty,
        );
        if (prevHead === cursor) {
          // No concurrent appends — our push is contiguous with
          // the server head. Re-read after async gap to avoid
          // clobbering concurrent writes. Mark dirty=false: our
          // edits are now on the server.
          const { cursor: freshCursor } = syncState.read();
          syncState.write({
            cursor: Math.max(result.assignedSeq, freshCursor),
            stateVector: encodeStateVector(ydoc),
            dirty: false,
            lastSuccessfulSyncAt: Date.now(),
          });
          if (result.compactHint) {
            // Server flagged soft cap — compact to free storage.
            await doCompactRef.current(result.assignedSeq);
            return;
          }
          // Check for pending local edits; no pull needed.
          schedulePushIfPendingChanges(
            syncState.read(),
            schedulePushRef.current,
          );
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
      log('ydoc: local update (%d bytes), dirty triggered', update.byteLength);
      syncState.markDirty();
      post({ type: 'local-update', bytes: update });
      if (isLeaderRef.current) {
        schedulePushRef.current();
      }
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

export function triggerSync(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: SYNC_QUERY_KEY });
}
