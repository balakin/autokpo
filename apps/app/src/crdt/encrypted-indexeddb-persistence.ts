import type * as Y from 'yjs';

import { aesGcmDecrypt, aesGcmEncrypt } from '../e2ee/aes-gcm';

import { applyUpdate, encodeStateAsUpdate } from './y';

const DB_VERSION = 1;
const UPDATES_STORE = 'updates';
const PREFERRED_TRIM_SIZE = 500;

type EncryptedIndexeddbEnvelope = {
  schemaVersion: 1;
  encryptionAlgorithm: 'aes-256-gcm';
  encryptionVersion: 1;
  encryptionKeyId: string;
  iv: Uint8Array;
  ciphertext: Uint8Array;
};

export type EncryptedIndexeddbPersistenceOptions = {
  activeDek: Uint8Array;
  activeDekId: string;
};

export class EncryptedIndexeddbPersistence {
  readonly whenSynced: Promise<this>;

  private closing = false;
  private db: IDBDatabase | null = null;
  private readonly dbName: string;
  private destroyed = false;
  private readonly doc: Y.Doc;
  private readonly options: EncryptedIndexeddbPersistenceOptions;
  private updateCount = 0;
  private writeQueue: Promise<void> = Promise.resolve();

  private readonly aad: Uint8Array;

  private readonly storeUpdate = (
    update: Uint8Array,
    origin: unknown,
  ): void => {
    if (origin === this || this.destroyed) return;
    this.queueWrite(() => this.appendUpdate(update));
  };

  constructor(
    dbName: string,
    doc: Y.Doc,
    options: EncryptedIndexeddbPersistenceOptions,
  ) {
    this.dbName = dbName;
    this.doc = doc;
    this.options = options;
    this.aad = new TextEncoder().encode(
      `autokpo:yjs-indexeddb:v1:${dbName}:${UPDATES_STORE}:${options.activeDekId}`,
    );
    this.whenSynced = this.init();
  }

  async destroy(): Promise<void> {
    this.closing = true;
    this.doc.off('update', this.storeUpdate);
    await this.whenSynced.catch(() => {});
    await this.writeQueue.catch(() => {});
    this.destroyed = true;
    this.db?.close();
    this.db = null;
  }

  async clearData(): Promise<void> {
    await this.destroy();
    await deleteDatabase(this.dbName).catch(() => {});
  }

  private async init(): Promise<this> {
    try {
      this.db = await openDatabase(this.dbName);
      if (this.closing) {
        this.db.close();
        this.db = null;
        return this;
      }
      await this.loadFromDb();
    } catch {
      await this.resetDatabase();
    }

    if (!this.closing && !this.destroyed) {
      this.doc.on('update', this.storeUpdate);
    }
    return this;
  }

  private async loadFromDb(): Promise<void> {
    const db = this.requireDb();
    const records = await getAllUpdateRecords(db);
    this.updateCount = records.length;

    if (records.length === 0 || this.closing) return;

    const plaintexts: Uint8Array[] = [];
    for (const record of records) {
      if (this.closing) return;
      plaintexts.push(await this.decryptEnvelope(record.value));
    }

    if (this.closing) return;

    this.doc.transact(() => {
      for (const plaintext of plaintexts) {
        applyUpdate(this.doc, plaintext, this);
      }
    }, this);
  }

  private async resetDatabase(): Promise<void> {
    this.db?.close();
    this.db = null;
    const deleted = await deleteDatabase(this.dbName).catch(() => false);

    if (!deleted || this.closing) {
      this.updateCount = 0;
      return;
    }

    try {
      this.db = await openDatabase(this.dbName);
      this.updateCount = 0;
    } catch {
      this.db = null;
      this.updateCount = 0;
    }
  }

  private queueWrite(operation: () => Promise<void>): void {
    this.writeQueue = this.writeQueue
      .then(async () => {
        if (this.destroyed || this.db === null) return;
        await operation();
      })
      .catch(async () => {
        if (this.destroyed) return;
        await this.resetDatabase();
      });
  }

  private async appendUpdate(update: Uint8Array): Promise<void> {
    const db = this.requireDb();
    const envelope = await this.encryptUpdate(update);
    await addUpdate(db, envelope);
    this.updateCount += 1;

    if (this.updateCount >= PREFERRED_TRIM_SIZE) {
      await this.compact();
    }
  }

  private async compact(): Promise<void> {
    const db = this.requireDb();
    const records = await getAllUpdateRecords(db);
    const maxCompactedKey = records.at(-1)?.key;

    if (records.length === 0 || maxCompactedKey === undefined) {
      this.updateCount = 0;
      return;
    }

    const plaintexts: Uint8Array[] = [];
    for (const record of records) {
      plaintexts.push(await this.decryptEnvelope(record.value));
    }

    this.doc.transact(() => {
      for (const plaintext of plaintexts) {
        applyUpdate(this.doc, plaintext, this);
      }
    }, this);

    const snapshot = encodeStateAsUpdate(this.doc);
    const envelope = await this.encryptUpdate(snapshot);
    await addUpdate(db, envelope);
    await deleteUpdatesThrough(db, maxCompactedKey);
    this.updateCount = 1;
  }

  private async encryptUpdate(
    plaintext: Uint8Array,
  ): Promise<EncryptedIndexeddbEnvelope> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await aesGcmEncrypt({
      keyBytes: this.options.activeDek,
      iv,
      plaintext,
      aad: this.aad,
    });

    return {
      schemaVersion: 1,
      encryptionAlgorithm: 'aes-256-gcm',
      encryptionVersion: 1,
      encryptionKeyId: this.options.activeDekId,
      iv,
      ciphertext,
    };
  }

  private async decryptEnvelope(value: unknown): Promise<Uint8Array> {
    const envelope = parseEnvelope(value, this.options.activeDekId);
    return aesGcmDecrypt({
      keyBytes: this.options.activeDek,
      iv: envelope.iv,
      ciphertext: envelope.ciphertext,
      aad: this.aad,
    });
  }

  private requireDb(): IDBDatabase {
    if (this.db === null) {
      throw new Error('Encrypted IndexedDB persistence is unavailable');
    }
    return this.db;
  }
}

function parseEnvelope(
  value: unknown,
  keyId: string,
): EncryptedIndexeddbEnvelope {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Invalid encrypted IndexedDB envelope');
  }

  const envelope = value as Partial<EncryptedIndexeddbEnvelope>;
  if (envelope.schemaVersion !== 1) {
    throw new Error('Unsupported encrypted IndexedDB schema version');
  }
  if (envelope.encryptionAlgorithm !== 'aes-256-gcm') {
    throw new Error('Unsupported encrypted IndexedDB algorithm');
  }
  if (envelope.encryptionVersion !== 1) {
    throw new Error('Unsupported encrypted IndexedDB encryption version');
  }
  if (envelope.encryptionKeyId !== keyId) {
    throw new Error('Unexpected encrypted IndexedDB key id');
  }
  if (!isUint8ArrayLike(envelope.iv)) {
    throw new Error('Invalid encrypted IndexedDB IV');
  }
  if (!isUint8ArrayLike(envelope.ciphertext)) {
    throw new Error('Invalid encrypted IndexedDB ciphertext');
  }

  return {
    schemaVersion: 1,
    encryptionAlgorithm: 'aes-256-gcm',
    encryptionVersion: 1,
    encryptionKeyId: keyId,
    iv: toUint8Array(envelope.iv),
    ciphertext: toUint8Array(envelope.ciphertext),
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

function openDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(UPDATES_STORE)) {
        db.createObjectStore(UPDATES_STORE, { autoIncrement: true });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () =>
      reject(toError(request.error, 'IndexedDB open failed'));
    request.onblocked = () => reject(request.error ?? new Error('Blocked'));
  });
}

function deleteDatabase(name: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve(true);
    request.onerror = () =>
      reject(toError(request.error, 'IndexedDB delete failed'));
    request.onblocked = () => resolve(false);
  });
}

function getAllUpdateRecords(db: IDBDatabase): Promise<UpdateRecord[]> {
  return withStore(db, 'readonly', (store) => {
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

function addUpdate(
  db: IDBDatabase,
  envelope: EncryptedIndexeddbEnvelope,
): Promise<IDBValidKey> {
  return withStore(db, 'readwrite', (store) =>
    requestToPromise(store.add(envelope)),
  );
}

function deleteUpdatesThrough(
  db: IDBDatabase,
  key: IDBValidKey,
): Promise<void> {
  return withStore(db, 'readwrite', async (store) => {
    await requestToPromise(store.delete(IDBKeyRange.upperBound(key)));
  });
}

function withStore<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(UPDATES_STORE, mode);
    const store = transaction.objectStore(UPDATES_STORE);
    let result: T;

    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () =>
      reject(toError(transaction.error, 'IndexedDB transaction failed'));
    transaction.onabort = () =>
      reject(toError(transaction.error, 'IndexedDB transaction aborted'));

    operation(store).then(
      (value) => {
        result = value;
      },
      (error: unknown) => {
        reject(toError(error, 'IndexedDB operation failed'));
        try {
          transaction.abort();
        } catch {
          // Transaction may already be completed or aborted.
        }
      },
    );
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(toError(request.error, 'IndexedDB request failed'));
  });
}

function toError(value: unknown, fallbackMessage: string): Error {
  return value instanceof Error ? value : new Error(fallbackMessage);
}
