import * as Y from 'yjs';

import { aesGcmDecrypt, aesGcmEncrypt } from '../e2ee/aes-gcm';
import {
  deleteDatabase,
  openDatabase,
  requestToPromise,
  withStore,
  withStores,
} from '../indexeddb/idb';
import { createLogger } from '../utils/create-logger';

import { applyUpdate, encodeStateAsUpdate } from './y';

const DB_VERSION = 1;
const UPDATES_STORE = 'updates';
const LOCAL_KEY_STORE = 'local_key';
const ACTIVE_LOCAL_KEY_ID = 'active';
const PREFERRED_TRIM_SIZE = 500;
const LOCAL_DEK_BYTES = 32;
const MAX_STALE_KEY_RETRIES = 2;

const log = createLogger('local-db');

class ActiveLocalKeyChangedError extends Error {
  constructor() {
    super('Active local persistence key changed');
    this.name = 'ActiveLocalKeyChangedError';
  }
}

type EncryptedIndexeddbEnvelope = {
  schemaVersion: 1;
  kind: 'update' | 'snapshot';
  id: string;
  encryptionAlgorithm: 'aes-256-gcm';
  encryptionVersion: 1;
  encryptionKeyId: string;
  iv: Uint8Array;
  ciphertext: Uint8Array;
};

type LocalKeyRecord = {
  id: 'active';
  schemaVersion: 1;
  localDekId: string;
  wrappingAlgorithm: 'aes-256-gcm';
  wrappingVersion: 1;
  wrappingIv: Uint8Array;
  wrappedDek: Uint8Array;
  createdAt: string;
};

type ActiveLocalKey = {
  record: LocalKeyRecord;
  keyBytes: Uint8Array;
};

export type EncryptedIndexeddbPersistenceOptions = {
  mek: Uint8Array;
  onReset?: () => void;
};

export class EncryptedIndexeddbPersistence {
  readonly whenSynced: Promise<this>;

  private activeLocalKey: ActiveLocalKey | null = null;
  private closing = false;
  private db: IDBDatabase | null = null;
  private readonly dbName: string;
  private destroyed = false;
  private readonly doc: Y.Doc;
  private readonly lockName: string;
  private readonly options: EncryptedIndexeddbPersistenceOptions;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(
    dbName: string,
    doc: Y.Doc,
    options: EncryptedIndexeddbPersistenceOptions,
  ) {
    this.dbName = dbName;
    this.doc = doc;
    this.options = options;
    this.lockName = `autokpo:local-persistence:${dbName}`;
    this.whenSynced = this.init();
  }

  async destroy(): Promise<void> {
    log('destroy: db=%s', this.dbName);
    this.closing = true;
    await this.whenSynced.catch(() => {});
    await this.writeQueue.catch(() => {});
    this.destroyed = true;
    this.db?.close();
    this.db = null;
    this.activeLocalKey = null;
  }

  async clearData(): Promise<void> {
    log('clear: db=%s', this.dbName);
    await this.destroy();
    await this.withLocalPersistenceLock(() =>
      deleteDatabase(this.dbName).then(() => undefined),
    ).catch(() => {});
  }

  persistLocalUpdate(update: Uint8Array): Promise<void> {
    return this.queueWrite(() =>
      this.withLocalPersistenceLock(async () => {
        const updateCount = await this.appendUpdateWithoutLock(
          update,
          'update',
        );
        if (updateCount >= PREFERRED_TRIM_SIZE) {
          await this.compactWithoutLock();
        }
      }),
    );
  }

  persistRemoteUpdates(updates: Uint8Array[]): Promise<void> {
    if (updates.length === 0) return Promise.resolve();
    return this.queueWrite(() =>
      this.withLocalPersistenceLock(async () => {
        let updateCount = 0;
        for (const update of updates) {
          updateCount = await this.appendUpdateWithoutLock(update, 'update');
        }
        if (updateCount >= PREFERRED_TRIM_SIZE) {
          await this.compactWithoutLock();
        }
      }),
    );
  }

  compactAndRotate(): Promise<void> {
    return this.queueWrite(() =>
      this.withLocalPersistenceLock(() => this.compactWithoutLock()),
    );
  }

  private async init(): Promise<this> {
    try {
      log('init: opening db=%s', this.dbName);
      await this.open();
      if (this.closing) {
        this.db?.close();
        this.db = null;
        return this;
      }
      await this.loadFromDb();
      log('init: ready db=%s', this.dbName);
    } catch {
      log('init: reset after startup failure db=%s', this.dbName);
      await this.resetDatabase();
    }

    return this;
  }

  private async open(): Promise<void> {
    this.db = await openDatabase(this.dbName, DB_VERSION, (db) => {
      if (!db.objectStoreNames.contains(UPDATES_STORE)) {
        db.createObjectStore(UPDATES_STORE, { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(LOCAL_KEY_STORE)) {
        db.createObjectStore(LOCAL_KEY_STORE, { keyPath: 'id' });
      }
    });
  }

  private async loadFromDb(): Promise<void> {
    const db = this.requireDb();
    await this.ensureActiveLocalKey(db);
    const { key, records } = await readActiveKeyAndUpdateRecords(db);
    const activeKey = await this.unwrapLocalKey(key);
    this.activeLocalKey = activeKey;

    log(
      'load: rows=%d key=%s db=%s',
      records.length,
      activeKey.record.localDekId,
      this.dbName,
    );

    if (records.length === 0 || this.closing) return;

    const plaintexts: Uint8Array[] = [];
    for (const record of records) {
      if (this.closing) return;
      plaintexts.push(await this.decryptEnvelope(record.value, activeKey));
    }

    if (this.closing) return;

    this.doc.transact(() => {
      for (const plaintext of plaintexts) {
        applyUpdate(this.doc, plaintext, this);
      }
    }, this);
  }

  private async resetDatabase(): Promise<void> {
    log('reset: db=%s', this.dbName);
    this.db?.close();
    this.db = null;
    this.activeLocalKey = null;
    await this.withLocalPersistenceLock(async () => {
      await deleteDatabase(this.dbName).catch(() => false);
      if (this.closing) {
        return;
      }
      try {
        await this.open();
        await this.ensureActiveLocalKey(this.requireDb());
        log('reset: recreated db=%s', this.dbName);
        this.options.onReset?.();
      } catch {
        log('reset: failed to recreate db=%s', this.dbName);
        this.db = null;
      }
    });
  }

  private queueWrite(operation: () => Promise<void>): Promise<void> {
    this.writeQueue = this.writeQueue
      .then(async () => {
        await this.whenSynced.catch(() => {});
        if (this.destroyed || this.db === null) return;
        await operation();
      })
      .catch(async () => {
        if (this.destroyed) return;
        await this.resetDatabase();
      });
    return this.writeQueue;
  }

  private async appendUpdateWithoutLock(
    update: Uint8Array,
    kind: 'update' | 'snapshot',
    attempt = 0,
  ): Promise<number> {
    const db = this.requireDb();
    const activeKey = await this.getActiveLocalKey(db);
    const envelope = await this.encryptUpdate(update, activeKey, kind);
    try {
      const count = await addUpdateIfActiveKeyMatches(
        db,
        envelope,
        activeKey.record.localDekId,
      );
      log(
        'append: kind=%s rows=%d key=%s db=%s',
        kind,
        count,
        activeKey.record.localDekId,
        this.dbName,
      );
      return count;
    } catch (error) {
      if (
        error instanceof ActiveLocalKeyChangedError &&
        attempt < MAX_STALE_KEY_RETRIES
      ) {
        log('append: stale key retry=%d db=%s', attempt + 1, this.dbName);
        this.activeLocalKey = null;
        return this.appendUpdateWithoutLock(update, kind, attempt + 1);
      }
      throw error;
    }
  }

  private async compactWithoutLock(attempt = 0): Promise<void> {
    const db = this.requireDb();
    const activeKey = await this.getActiveLocalKey(db);
    const records = await getAllUpdateRecords(db);
    const maxCompactedKey = records.at(-1)?.key;

    log(
      'compact: start rows=%d key=%s db=%s',
      records.length,
      activeKey.record.localDekId,
      this.dbName,
    );

    if (records.length === 0 || maxCompactedKey === undefined) {
      log('compact: skipped empty db=%s', this.dbName);
      return;
    }

    const plaintexts: Uint8Array[] = [];
    for (const record of records) {
      plaintexts.push(await this.decryptEnvelope(record.value, activeKey));
    }

    const nextKey = await this.createLocalKeyRecord();
    const snapshot = this.encodeCompactedSnapshot(plaintexts);
    const envelope = await this.encryptUpdate(snapshot, nextKey, 'snapshot');
    try {
      await replaceWithCompactedSnapshot(
        db,
        nextKey.record,
        envelope,
        maxCompactedKey,
        activeKey.record.localDekId,
      );
    } catch (error) {
      if (
        error instanceof ActiveLocalKeyChangedError &&
        attempt < MAX_STALE_KEY_RETRIES
      ) {
        log('compact: stale key retry=%d db=%s', attempt + 1, this.dbName);
        this.activeLocalKey = null;
        await this.compactWithoutLock(attempt + 1);
        return;
      }
      throw error;
    }
    this.activeLocalKey = nextKey;
    log(
      'compact: done rows=%d oldKey=%s newKey=%s db=%s',
      records.length,
      activeKey.record.localDekId,
      nextKey.record.localDekId,
      this.dbName,
    );
  }

  private async ensureActiveLocalKey(db: IDBDatabase): Promise<void> {
    const existing = await readLocalKeyRecord(db);
    if (existing !== null) {
      this.activeLocalKey = await this.unwrapLocalKey(existing);
      return;
    }
    const key = await this.createLocalKeyRecord();
    await writeLocalKeyRecord(db, key.record);
    this.activeLocalKey = key;
    log('key: created key=%s db=%s', key.record.localDekId, this.dbName);
  }

  private encodeCompactedSnapshot(plaintexts: Uint8Array[]): Uint8Array {
    const compactedDoc = new Y.Doc();
    try {
      applyUpdate(compactedDoc, encodeStateAsUpdate(this.doc), this);
      for (const plaintext of plaintexts) {
        applyUpdate(compactedDoc, plaintext, this);
      }
      return encodeStateAsUpdate(compactedDoc);
    } finally {
      compactedDoc.destroy();
    }
  }

  private async getActiveLocalKey(db: IDBDatabase): Promise<ActiveLocalKey> {
    const record = await readLocalKeyRecord(db);
    if (record === null) {
      throw new Error('Missing active local persistence key');
    }
    if (this.activeLocalKey?.record.localDekId === record.localDekId) {
      return this.activeLocalKey;
    }
    const activeKey = await this.unwrapLocalKey(record);
    this.activeLocalKey = activeKey;
    return activeKey;
  }

  private async createLocalKeyRecord(): Promise<ActiveLocalKey> {
    const keyBytes = crypto.getRandomValues(new Uint8Array(LOCAL_DEK_BYTES));
    const localDekId = crypto.randomUUID();
    const wrappingIv = crypto.getRandomValues(new Uint8Array(12));
    const wrappedDek = await aesGcmEncrypt({
      keyBytes: this.options.mek,
      iv: wrappingIv,
      plaintext: keyBytes,
      aad: this.localKeyAad(localDekId),
    });
    return {
      keyBytes,
      record: {
        id: ACTIVE_LOCAL_KEY_ID,
        schemaVersion: 1,
        localDekId,
        wrappingAlgorithm: 'aes-256-gcm',
        wrappingVersion: 1,
        wrappingIv,
        wrappedDek,
        createdAt: new Date().toISOString(),
      },
    };
  }

  private async unwrapLocalKey(
    record: LocalKeyRecord,
  ): Promise<ActiveLocalKey> {
    const keyBytes = await aesGcmDecrypt({
      keyBytes: this.options.mek,
      iv: record.wrappingIv,
      ciphertext: record.wrappedDek,
      aad: this.localKeyAad(record.localDekId),
    });
    if (keyBytes.byteLength !== LOCAL_DEK_BYTES) {
      throw new Error('Invalid local persistence key length');
    }
    return { record, keyBytes };
  }

  private async encryptUpdate(
    plaintext: Uint8Array,
    activeKey: ActiveLocalKey,
    kind: 'update' | 'snapshot',
  ): Promise<EncryptedIndexeddbEnvelope> {
    const id = crypto.randomUUID();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await aesGcmEncrypt({
      keyBytes: activeKey.keyBytes,
      iv,
      plaintext,
      aad: this.envelopeAad(kind, id, activeKey.record.localDekId),
    });

    return {
      schemaVersion: 1,
      kind,
      id,
      encryptionAlgorithm: 'aes-256-gcm',
      encryptionVersion: 1,
      encryptionKeyId: activeKey.record.localDekId,
      iv,
      ciphertext,
    };
  }

  private async decryptEnvelope(
    value: unknown,
    activeKey: ActiveLocalKey,
  ): Promise<Uint8Array> {
    const envelope = parseEnvelope(value);
    if (envelope.encryptionKeyId !== activeKey.record.localDekId) {
      throw new Error('Unexpected encrypted IndexedDB key id');
    }
    return aesGcmDecrypt({
      keyBytes: activeKey.keyBytes,
      iv: envelope.iv,
      ciphertext: envelope.ciphertext,
      aad: this.envelopeAad(
        envelope.kind,
        envelope.id,
        envelope.encryptionKeyId,
      ),
    });
  }

  private envelopeAad(
    kind: 'update' | 'snapshot',
    id: string,
    localDekId: string,
  ): Uint8Array {
    return new TextEncoder().encode(
      `autokpo:yjs-indexeddb:v1:${this.dbName}:${UPDATES_STORE}:${kind}:${id}:${localDekId}`,
    );
  }

  private localKeyAad(localDekId: string): Uint8Array {
    return new TextEncoder().encode(
      `autokpo:yjs-indexeddb-local-dek:v1:${this.dbName}:${localDekId}`,
    );
  }

  private async withLocalPersistenceLock<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    if (!('locks' in navigator) || navigator.locks === undefined) {
      return operation();
    }
    if (navigator.locks.request.length === 0) {
      return operation();
    }
    return navigator.locks.request(this.lockName, operation);
  }

  private requireDb(): IDBDatabase {
    if (this.db === null) {
      throw new Error('Encrypted IndexedDB persistence is unavailable');
    }
    return this.db;
  }
}

function parseEnvelope(value: unknown): EncryptedIndexeddbEnvelope {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Invalid encrypted IndexedDB envelope');
  }

  const envelope = value as Partial<EncryptedIndexeddbEnvelope>;
  if (envelope.schemaVersion !== 1) {
    throw new Error('Unsupported encrypted IndexedDB schema version');
  }
  if (envelope.kind !== 'update' && envelope.kind !== 'snapshot') {
    throw new Error('Unsupported encrypted IndexedDB row kind');
  }
  if (typeof envelope.id !== 'string' || envelope.id.length === 0) {
    throw new Error('Invalid encrypted IndexedDB row id');
  }
  if (envelope.encryptionAlgorithm !== 'aes-256-gcm') {
    throw new Error('Unsupported encrypted IndexedDB algorithm');
  }
  if (envelope.encryptionVersion !== 1) {
    throw new Error('Unsupported encrypted IndexedDB encryption version');
  }
  if (
    typeof envelope.encryptionKeyId !== 'string' ||
    envelope.encryptionKeyId.length === 0
  ) {
    throw new Error('Invalid encrypted IndexedDB key id');
  }
  if (!isUint8ArrayLike(envelope.iv)) {
    throw new Error('Invalid encrypted IndexedDB IV');
  }
  if (!isUint8ArrayLike(envelope.ciphertext)) {
    throw new Error('Invalid encrypted IndexedDB ciphertext');
  }

  return {
    schemaVersion: 1,
    kind: envelope.kind,
    id: envelope.id,
    encryptionAlgorithm: 'aes-256-gcm',
    encryptionVersion: 1,
    encryptionKeyId: envelope.encryptionKeyId,
    iv: toUint8Array(envelope.iv),
    ciphertext: toUint8Array(envelope.ciphertext),
  };
}

function parseLocalKeyRecord(value: unknown): LocalKeyRecord {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Invalid local persistence key record');
  }
  const record = value as Partial<LocalKeyRecord>;
  if (record.id !== ACTIVE_LOCAL_KEY_ID) {
    throw new Error('Invalid local persistence key id');
  }
  if (record.schemaVersion !== 1) {
    throw new Error('Unsupported local persistence key schema version');
  }
  if (typeof record.localDekId !== 'string' || record.localDekId.length === 0) {
    throw new Error('Invalid local persistence DEK id');
  }
  if (record.wrappingAlgorithm !== 'aes-256-gcm') {
    throw new Error('Unsupported local persistence key wrapping algorithm');
  }
  if (record.wrappingVersion !== 1) {
    throw new Error('Unsupported local persistence key wrapping version');
  }
  if (!isUint8ArrayLike(record.wrappingIv)) {
    throw new Error('Invalid local persistence key wrapping IV');
  }
  if (!isUint8ArrayLike(record.wrappedDek)) {
    throw new Error('Invalid wrapped local persistence DEK');
  }
  if (typeof record.createdAt !== 'string' || record.createdAt.length === 0) {
    throw new Error('Invalid local persistence key createdAt');
  }
  return {
    id: ACTIVE_LOCAL_KEY_ID,
    schemaVersion: 1,
    localDekId: record.localDekId,
    wrappingAlgorithm: 'aes-256-gcm',
    wrappingVersion: 1,
    wrappingIv: toUint8Array(record.wrappingIv),
    wrappedDek: toUint8Array(record.wrappedDek),
    createdAt: record.createdAt,
  };
}

function isUint8ArrayLike(value: unknown): value is Uint8Array {
  return ArrayBuffer.isView(value) && value.constructor.name === 'Uint8Array';
}

function toUint8Array(value: Uint8Array): Uint8Array {
  return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}

type UpdateRecord = {
  key: IDBValidKey;
  value: unknown;
};

async function readActiveKeyAndUpdateRecords(
  db: IDBDatabase,
): Promise<{ key: LocalKeyRecord; records: UpdateRecord[] }> {
  return withStores(
    db,
    [LOCAL_KEY_STORE, UPDATES_STORE],
    'readonly',
    async (stores) => {
      const localKeyStore = requireStore(stores, LOCAL_KEY_STORE);
      const updatesStore = requireStore(stores, UPDATES_STORE);
      const [keyRaw, values, keys] = await Promise.all([
        requestToPromise<unknown>(localKeyStore.get(ACTIVE_LOCAL_KEY_ID)),
        requestToPromise<unknown[]>(updatesStore.getAll()),
        requestToPromise<IDBValidKey[]>(updatesStore.getAllKeys()),
      ]);
      if (keyRaw === undefined) {
        throw new Error('Missing active local persistence key');
      }
      return {
        key: parseLocalKeyRecord(keyRaw),
        records: values.map((value, index) => ({ key: keys[index], value })),
      };
    },
  );
}

function readLocalKeyRecord(db: IDBDatabase): Promise<LocalKeyRecord | null> {
  return withStore(db, LOCAL_KEY_STORE, 'readonly', async (store) => {
    const raw = await requestToPromise<unknown>(store.get(ACTIVE_LOCAL_KEY_ID));
    return raw === undefined ? null : parseLocalKeyRecord(raw);
  });
}

function writeLocalKeyRecord(
  db: IDBDatabase,
  record: LocalKeyRecord,
): Promise<void> {
  return withStore(db, LOCAL_KEY_STORE, 'readwrite', (store) =>
    requestToPromise(store.put(record)).then(() => undefined),
  );
}

function getAllUpdateRecords(db: IDBDatabase): Promise<UpdateRecord[]> {
  return withStore(db, UPDATES_STORE, 'readonly', (store) => {
    const valuesRequest: IDBRequest<unknown[]> = store.getAll();
    const keysRequest: IDBRequest<IDBValidKey[]> = store.getAllKeys();

    return Promise.all([
      requestToPromise(valuesRequest),
      requestToPromise(keysRequest),
    ]).then(([values, keys]) =>
      values.map((value, index) => ({ key: keys[index], value })),
    );
  });
}

function addUpdateIfActiveKeyMatches(
  db: IDBDatabase,
  envelope: EncryptedIndexeddbEnvelope,
  expectedLocalDekId: string,
): Promise<number> {
  return withStores(
    db,
    [LOCAL_KEY_STORE, UPDATES_STORE],
    'readwrite',
    async (stores) => {
      const localKeyStore = requireStore(stores, LOCAL_KEY_STORE);
      const updatesStore = requireStore(stores, UPDATES_STORE);
      const raw = await requestToPromise<unknown>(
        localKeyStore.get(ACTIVE_LOCAL_KEY_ID),
      );
      const activeKey = parseLocalKeyRecord(raw);
      if (activeKey.localDekId !== expectedLocalDekId) {
        throw new ActiveLocalKeyChangedError();
      }
      await requestToPromise(updatesStore.add(envelope));
      return requestToPromise(updatesStore.count());
    },
  );
}

function replaceWithCompactedSnapshot(
  db: IDBDatabase,
  localKey: LocalKeyRecord,
  envelope: EncryptedIndexeddbEnvelope,
  maxCompactedKey: IDBValidKey,
  expectedLocalDekId: string,
): Promise<void> {
  return withStores(
    db,
    [LOCAL_KEY_STORE, UPDATES_STORE],
    'readwrite',
    async (stores) => {
      const localKeyStore = requireStore(stores, LOCAL_KEY_STORE);
      const updatesStore = requireStore(stores, UPDATES_STORE);
      const raw = await requestToPromise<unknown>(
        localKeyStore.get(ACTIVE_LOCAL_KEY_ID),
      );
      const activeKey = parseLocalKeyRecord(raw);
      if (activeKey.localDekId !== expectedLocalDekId) {
        throw new ActiveLocalKeyChangedError();
      }
      await requestToPromise(localKeyStore.put(localKey));
      await requestToPromise(updatesStore.add(envelope));
      await requestToPromise(
        updatesStore.delete(IDBKeyRange.upperBound(maxCompactedKey)),
      );
    },
  );
}

function requireStore(
  stores: Map<string, IDBObjectStore>,
  storeName: string,
): IDBObjectStore {
  const store = stores.get(storeName);
  if (!store) throw new Error(`Missing IndexedDB store: ${storeName}`);
  return store;
}
