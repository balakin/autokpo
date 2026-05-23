import { afterEach, describe, expect, it } from 'vitest';
import * as Y from 'yjs';

import { EncryptedIndexeddbPersistence } from '../encrypted-indexeddb-persistence';
import { REMOTE_ORIGIN } from '../sync-logic';

const MASTER_KEY = new Uint8Array(32).fill(7);
const OTHER_MASTER_KEY = new Uint8Array(32).fill(8);
const KEY_ID = 'key-1';

const providers: EncryptedIndexeddbPersistence[] = [];

afterEach(async () => {
  await Promise.all(providers.splice(0).map((provider) => provider.destroy()));
});

describe('EncryptedIndexeddbPersistence', () => {
  it('stores Yjs updates as encrypted envelopes instead of plaintext bytes', async () => {
    const dbName = uniqueDbName();
    const doc = new Y.Doc();
    const provider = track(newProvider(dbName, doc));
    await provider.whenSynced;

    let plaintextUpdate: Uint8Array | null = null;
    doc.once('update', (update: Uint8Array) => {
      plaintextUpdate = update;
    });
    doc.getMap('root').set('secret', 'value');
    await provider.destroy();

    const rows = await readRows(dbName);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      schemaVersion: 1,
      encryptionAlgorithm: 'aes-256-gcm',
      encryptionVersion: 1,
      encryptionKeyId: KEY_ID,
    });
    expect(ArrayBuffer.isView(rows[0].iv)).toBe(true);
    expect(rows[0].iv).toHaveLength(12);
    expect(ArrayBuffer.isView(rows[0].ciphertext)).toBe(true);
    expect(rows[0].ciphertext).not.toEqual(plaintextUpdate);
  });

  it('rehydrates a fresh Y.Doc from encrypted IndexedDB rows', async () => {
    const dbName = uniqueDbName();
    const source = new Y.Doc();
    const sourceProvider = track(newProvider(dbName, source));
    await sourceProvider.whenSynced;
    source.getMap('root').set('secret', 'value');
    await sourceProvider.destroy();

    const target = new Y.Doc();
    const targetProvider = track(newProvider(dbName, target));
    await targetProvider.whenSynced;

    expect(target.getMap('root').get('secret')).toBe('value');
  });

  it('treats wrong-key decrypt failures as an empty cache', async () => {
    const dbName = uniqueDbName();
    const source = new Y.Doc();
    const sourceProvider = track(newProvider(dbName, source));
    await sourceProvider.whenSynced;
    source.getMap('root').set('secret', 'value');
    await sourceProvider.destroy();

    const target = new Y.Doc();
    const targetProvider = track(
      newProvider(dbName, target, { activeDek: OTHER_MASTER_KEY }),
    );
    await targetProvider.whenSynced;

    expect(target.getMap('root').get('secret')).toBeUndefined();
    expect(await readRows(dbName)).toHaveLength(0);
  });

  it('treats key-id AAD mismatches as an empty cache', async () => {
    const dbName = uniqueDbName();
    const source = new Y.Doc();
    const sourceProvider = track(newProvider(dbName, source));
    await sourceProvider.whenSynced;
    source.getMap('root').set('secret', 'value');
    await sourceProvider.destroy();

    const target = new Y.Doc();
    const targetProvider = track(
      newProvider(dbName, target, { activeDekId: 'key-2' }),
    );
    await targetProvider.whenSynced;

    expect(target.getMap('root').get('secret')).toBeUndefined();
    expect(await readRows(dbName)).toHaveLength(0);
  });

  it('treats database-name AAD mismatches as an empty cache', async () => {
    const sourceDbName = uniqueDbName();
    const targetDbName = uniqueDbName();
    const source = new Y.Doc();
    const sourceProvider = track(newProvider(sourceDbName, source));
    await sourceProvider.whenSynced;
    source.getMap('root').set('secret', 'value');
    await sourceProvider.destroy();

    const [row] = await readRows(sourceDbName);
    await writeRawRow(targetDbName, row);

    const target = new Y.Doc();
    const targetProvider = track(newProvider(targetDbName, target));
    await targetProvider.whenSynced;

    expect(target.getMap('root').get('secret')).toBeUndefined();
    expect(await readRows(targetDbName)).toHaveLength(0);
  });

  it('treats unsupported envelope metadata as an empty cache', async () => {
    const dbName = uniqueDbName();
    await writeRawRow(dbName, {
      schemaVersion: 99,
      encryptionAlgorithm: 'aes-256-gcm',
      encryptionVersion: 1,
      encryptionKeyId: KEY_ID,
      iv: new Uint8Array(12),
      ciphertext: new Uint8Array([1, 2, 3]),
    });

    const doc = new Y.Doc();
    const provider = track(newProvider(dbName, doc));
    await provider.whenSynced;

    expect(await readRows(dbName)).toHaveLength(0);
  });

  it('continues with an empty cache when IndexedDB is unavailable', async () => {
    const originalIndexedDb = globalThis.indexedDB;
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      value: undefined,
    });

    try {
      const doc = new Y.Doc();
      const provider = track(newProvider(uniqueDbName(), doc));
      await provider.whenSynced;
      doc.getMap('root').set('local', 'value');
      await provider.destroy();
      expect(doc.getMap('root').get('local')).toBe('value');
    } finally {
      Object.defineProperty(globalThis, 'indexedDB', {
        configurable: true,
        value: originalIndexedDb,
      });
    }
  });

  it('deletes cached rows on clearData', async () => {
    const dbName = uniqueDbName();
    const doc = new Y.Doc();
    const provider = track(newProvider(dbName, doc));
    await provider.whenSynced;
    doc.getMap('root').set('secret', 'value');

    await provider.clearData();

    expect(await readRows(dbName)).toHaveLength(0);
  });

  it('can be destroyed before startup readiness resolves', async () => {
    const dbName = uniqueDbName();
    const doc = new Y.Doc();
    const provider = track(newProvider(dbName, doc));

    await provider.destroy();
    await provider.whenSynced;
    doc.getMap('root').set('after-destroy', 'value');

    expect(await readRows(dbName)).toHaveLength(0);
  });

  it('does not re-persist provider replay updates but persists remote sync updates', async () => {
    const dbName = uniqueDbName();
    const source = new Y.Doc();
    const sourceProvider = track(newProvider(dbName, source));
    await sourceProvider.whenSynced;
    source.getMap('root').set('local', 'value');
    await sourceProvider.destroy();

    const target = new Y.Doc();
    const targetProvider = track(newProvider(dbName, target));
    await targetProvider.whenSynced;
    await targetProvider.destroy();
    expect(await readRows(dbName)).toHaveLength(1);

    const remote = new Y.Doc();
    remote.getMap('root').set('remote', 'value');
    const remoteUpdate = Y.encodeStateAsUpdate(remote);
    const listeningProvider = track(newProvider(dbName, target));
    await listeningProvider.whenSynced;
    Y.applyUpdate(target, remoteUpdate, REMOTE_ORIGIN);
    await listeningProvider.destroy();

    expect(await readRows(dbName)).toHaveLength(2);
  });

  it('compacts after 500 updates and rehydrates the compacted state', async () => {
    const dbName = uniqueDbName();
    const source = new Y.Doc();
    const sourceProvider = track(newProvider(dbName, source));
    await sourceProvider.whenSynced;

    for (let i = 0; i < 500; i += 1) {
      source.getMap('root').set(`key-${i}`, i);
    }
    await sourceProvider.destroy();

    const rows = await readRows(dbName);
    expect(rows).toHaveLength(1);

    const target = new Y.Doc();
    const targetProvider = track(newProvider(dbName, target));
    await targetProvider.whenSynced;

    expect(target.getMap('root').get('key-0')).toBe(0);
    expect(target.getMap('root').get('key-499')).toBe(499);
  });

  it('compacts from all current IndexedDB rows even when this tab missed another tab update', async () => {
    const dbName = uniqueDbName();
    const staleDoc = new Y.Doc();
    const staleProvider = track(newProvider(dbName, staleDoc));
    await staleProvider.whenSynced;

    const otherDoc = new Y.Doc();
    const otherProvider = track(newProvider(dbName, otherDoc));
    await otherProvider.whenSynced;
    otherDoc.getMap('root').set('other-tab', 'preserved');
    await otherProvider.destroy();

    for (let i = 0; i < 500; i += 1) {
      staleDoc.getMap('root').set(`stale-tab-${i}`, i);
    }
    await staleProvider.destroy();

    const target = new Y.Doc();
    const targetProvider = track(newProvider(dbName, target));
    await targetProvider.whenSynced;

    expect(target.getMap('root').get('other-tab')).toBe('preserved');
    expect(target.getMap('root').get('stale-tab-499')).toBe(499);
  });
});

function newProvider(
  dbName: string,
  doc: Y.Doc,
  overrides: Partial<{
    activeDek: Uint8Array;
    activeDekId: string;
  }> = {},
): EncryptedIndexeddbPersistence {
  return new EncryptedIndexeddbPersistence(dbName, doc, {
    activeDek: overrides.activeDek ?? MASTER_KEY,
    activeDekId: overrides.activeDekId ?? KEY_ID,
  });
}

function track(
  provider: EncryptedIndexeddbPersistence,
): EncryptedIndexeddbPersistence {
  providers.push(provider);
  return provider;
}

function uniqueDbName(): string {
  return `encrypted-yjs-test:${crypto.randomUUID()}`;
}

async function readRows(dbName: string): Promise<EncryptedRow[]> {
  const db = await openDb(dbName);
  try {
    const rows = await withStore<unknown[]>(db, 'readonly', (store) =>
      store.getAll(),
    );
    return rows.map((row) => row as EncryptedRow);
  } finally {
    db.close();
  }
}

async function writeRawRow(dbName: string, row: unknown): Promise<void> {
  const db = await openDb(dbName);
  try {
    await withStore(db, 'readwrite', (store) => store.add(row));
  } finally {
    db.close();
  }
}

type EncryptedRow = {
  schemaVersion?: unknown;
  encryptionAlgorithm?: unknown;
  encryptionVersion?: unknown;
  encryptionKeyId?: unknown;
  iv?: unknown;
  ciphertext?: unknown;
};

function openDb(dbName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('updates', { autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(toError(request.error, 'IndexedDB open failed'));
  });
}

function withStore<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('updates', mode);
    const request = operation(transaction.objectStore('updates'));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(toError(request.error, 'IndexedDB request failed'));
    transaction.onerror = () =>
      reject(toError(transaction.error, 'IndexedDB transaction failed'));
  });
}

function toError(value: unknown, fallbackMessage: string): Error {
  return value instanceof Error ? value : new Error(fallbackMessage);
}
