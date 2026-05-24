type Subscriber = () => void;

export type SyncState = {
  cursor: number;
  stateVector: string | null;
  dirty: boolean;
  lastSuccessfulSyncAt: number | null;
};

export type ParsedSyncState = {
  cursor: number;
  stateVector: Uint8Array | null;
  dirty: boolean;
  lastSuccessfulSyncAt: number | null;
};

export type SyncStateStore = {
  key: string;
  read(): ParsedSyncState;
  write(state: {
    cursor: number;
    stateVector: Uint8Array | null;
    dirty: boolean;
    lastSuccessfulSyncAt: number | null;
  }): void;
  markDirty(): void;
  reset(): void;
  subscribe(cb: Subscriber): () => void;
  destroy(): void;
};

const DEFAULT_SYNC_STATE: ParsedSyncState = {
  cursor: 0,
  stateVector: null,
  dirty: false,
  lastSuccessfulSyncAt: null,
};

export function createSyncStateStore(userId: string): SyncStateStore {
  const key = `autokpo:sync:${userId}`;
  const listeners = new Set<Subscriber>();
  let isStorageSubscribed = false;

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  function onStorage(event: StorageEvent): void {
    if (event.key !== key) return;
    notify();
  }

  function ensureStorageSubscription(): void {
    if (isStorageSubscribed) return;
    window.addEventListener('storage', onStorage);
    isStorageSubscribed = true;
  }

  function removeStorageSubscription(): void {
    if (!isStorageSubscribed) return;
    window.removeEventListener('storage', onStorage);
    isStorageSubscribed = false;
  }

  function subscribe(cb: Subscriber): () => void {
    listeners.add(cb);
    ensureStorageSubscription();
    return () => {
      listeners.delete(cb);
      if (listeners.size === 0) {
        removeStorageSubscription();
      }
    };
  }

  function destroy(): void {
    listeners.clear();
    removeStorageSubscription();
  }

  function read(): ParsedSyncState {
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_SYNC_STATE;
    try {
      const parsed = JSON.parse(raw) as SyncState;
      return {
        cursor: parsed.cursor,
        stateVector: decodeSV(parsed.stateVector),
        dirty: parsed.dirty ?? false,
        lastSuccessfulSyncAt: parsed.lastSuccessfulSyncAt ?? null,
      };
    } catch {
      return DEFAULT_SYNC_STATE;
    }
  }

  function write(state: {
    cursor: number;
    stateVector: Uint8Array | null;
    dirty: boolean;
    lastSuccessfulSyncAt: number | null;
  }): void {
    const serialized: SyncState = {
      cursor: state.cursor,
      stateVector: encodeSV(state.stateVector),
      dirty: state.dirty,
      lastSuccessfulSyncAt: state.lastSuccessfulSyncAt,
    };
    localStorage.setItem(key, JSON.stringify(serialized));
    notify();
  }

  function markDirty(): void {
    const current = read();
    write({
      cursor: current.cursor,
      stateVector: current.stateVector,
      dirty: true,
      lastSuccessfulSyncAt: current.lastSuccessfulSyncAt,
    });
  }

  function reset(): void {
    const current = read();
    write({
      cursor: 0,
      stateVector: null,
      dirty: current.dirty,
      lastSuccessfulSyncAt: current.lastSuccessfulSyncAt,
    });
  }

  return {
    key,
    read,
    write,
    markDirty,
    reset,
    subscribe,
    destroy,
  };
}

export function resetSyncState(userId: string): void {
  const current = createSyncStateStore(userId);
  try {
    current.reset();
  } finally {
    current.destroy();
  }
}

export function listSyncKeys(): string[] {
  return Object.keys(localStorage).filter((key) =>
    key.startsWith('autokpo:sync:'),
  );
}

function encodeSV(stateVector: Uint8Array | null): string | null {
  if (stateVector === null) return null;
  return btoa(String.fromCharCode(...stateVector));
}

function decodeSV(encoded: string | null): Uint8Array | null {
  if (encoded === null) return null;
  return Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
}
