import { z } from 'zod';

import { openDatabase, requestToPromise, withStore } from '../indexeddb/idb';

import { kdfParamsV1Schema } from './key-ring-record';

function isUint8Array(v: unknown): v is Uint8Array {
  return ArrayBuffer.isView(v) && v.constructor.name === 'Uint8Array';
}

function toUint8Array(v: Uint8Array): Uint8Array {
  return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
}

const uint8ArraySchema = z
  .custom<Uint8Array>(isUint8Array)
  .transform(toUint8Array);

const aesGcmParamsSchema = z.object({
  iv: uint8ArraySchema,
  tagBits: z.number().int(),
});

const DB_NAME = 'autokpo-e2ee';
const DB_VERSION = 1;

const STORE_KEY_RING = 'key_ring';
const STORE_WRAPPER = 'wrapper';
const STORE_LOCAL_WRAPPER = 'local_wrapper';

// ---------------------------------------------------------------------------
// Schemas and inferred record types
// ---------------------------------------------------------------------------

const keyRingRecordSchema = z.object({
  userId: z.string(),
  keyRingId: z.string(),
  activeDekId: z.string(),
  revision: z.number().int().positive(),
  encryptionAlgorithm: z.literal('aes-256-gcm'),
  encryptionParams: aesGcmParamsSchema,
  ciphertext: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const wrapperRecordSchema = z.object({
  userId: z.string(),
  method: z.literal('password'),
  wrappingId: z.string(),
  ciphertext: uint8ArraySchema,
  wrappingAlgorithm: z.literal('aes-256-gcm'),
  wrappingParams: aesGcmParamsSchema,
  kdfAlgorithm: z.literal('argon2id'),
  kdfParams: kdfParamsV1Schema,
  kdfSalt: uint8ArraySchema,
  createdAt: z.string(),
});

const cryptoKeySchema = z.custom<CryptoKey>((v) =>
  typeof CryptoKey !== 'undefined'
    ? v instanceof CryptoKey
    : typeof v === 'object' && v !== null && 'type' in v && 'extractable' in v,
);

const localWrapperRecordLdkSchema = z.object({
  userId: z.string(),
  method: z.literal('ldk'),
  wrapperId: z.string(),
  ldk: cryptoKeySchema,
  ciphertext: uint8ArraySchema,
  wrappingAlgorithm: z.literal('aes-256-gcm'),
  wrappingParams: aesGcmParamsSchema,
});

const localWrapperRecordPinSchema = z.object({
  userId: z.string(),
  method: z.literal('pin'),
  wrapperId: z.string(),
  pinLdk: cryptoKeySchema,
  pinSaltCiphertext: uint8ArraySchema,
  pinSaltAlgorithm: z.literal('aes-256-gcm'),
  pinSaltParams: aesGcmParamsSchema,
  kdfAlgorithm: z.literal('argon2id'),
  kdfParams: kdfParamsV1Schema,
  wrappingAlgorithm: z.literal('aes-256-gcm'),
  wrappingParams: aesGcmParamsSchema,
  ciphertext: uint8ArraySchema,
  createdAt: z.string(),
  failedAttempts: z.number().int(),
});

export type KeyRingRecord = z.infer<typeof keyRingRecordSchema>;
export type WrapperRecord = z.infer<typeof wrapperRecordSchema>;
export type LocalWrapperRecordLdk = z.infer<typeof localWrapperRecordLdkSchema>;
export type LocalWrapperRecordPin = z.infer<typeof localWrapperRecordPinSchema>;
export type LocalWrapperRecord = LocalWrapperRecordLdk | LocalWrapperRecordPin;

// ---------------------------------------------------------------------------
// KeysIndexeddb class
// ---------------------------------------------------------------------------

export class KeysIndexeddb {
  readonly whenReady: Promise<void>;

  private db: IDBDatabase | null = null;

  constructor() {
    this.whenReady = openDatabase(DB_NAME, DB_VERSION, (db) => {
      if (!db.objectStoreNames.contains(STORE_KEY_RING)) {
        db.createObjectStore(STORE_KEY_RING, { keyPath: 'userId' });
      }
      if (!db.objectStoreNames.contains(STORE_WRAPPER)) {
        const wrapperStore = db.createObjectStore(STORE_WRAPPER, {
          keyPath: 'userId',
        });
        wrapperStore.createIndex('wrappingId', 'wrappingId', { unique: true });
      }
      if (!db.objectStoreNames.contains(STORE_LOCAL_WRAPPER)) {
        db.createObjectStore(STORE_LOCAL_WRAPPER, { keyPath: 'userId' });
      }
    }).then((db) => {
      this.db = db;
    });
  }

  close(): void {
    this.db?.close();
    this.db = null;
  }

  async readKeyRing(userId: string): Promise<KeyRingRecord | null> {
    const db = await this.requireDb();
    const raw = await withStore(db, STORE_KEY_RING, 'readonly', (store) =>
      requestToPromise<unknown>(store.get(userId)),
    );
    if (raw === undefined) return null;
    const result = keyRingRecordSchema.safeParse(raw);
    return result.success ? result.data : null;
  }

  async writeKeyRing(record: KeyRingRecord): Promise<void> {
    const db = await this.requireDb();
    await withStore(db, STORE_KEY_RING, 'readwrite', (store) =>
      requestToPromise(store.put(record)),
    );
  }

  async readWrapper(userId: string): Promise<WrapperRecord | null> {
    const db = await this.requireDb();
    const raw = await withStore(db, STORE_WRAPPER, 'readonly', (store) =>
      requestToPromise<unknown>(store.get(userId)),
    );
    if (raw === undefined) return null;
    const result = wrapperRecordSchema.safeParse(raw);
    return result.success ? result.data : null;
  }

  async writeWrapper(record: WrapperRecord): Promise<void> {
    const db = await this.requireDb();
    await withStore(db, STORE_WRAPPER, 'readwrite', (store) =>
      requestToPromise(store.put(record)),
    );
  }

  async readLocalWrapper(userId: string): Promise<LocalWrapperRecord | null> {
    const db = await this.requireDb();
    const raw = await withStore(db, STORE_LOCAL_WRAPPER, 'readonly', (store) =>
      requestToPromise<unknown>(store.get(userId)),
    );
    if (raw === undefined) return null;
    if (raw !== null && typeof raw === 'object' && 'method' in raw) {
      if (raw.method === 'ldk') {
        const result = localWrapperRecordLdkSchema.safeParse(raw);
        return result.success ? result.data : null;
      }
      if (raw.method === 'pin') {
        const result = localWrapperRecordPinSchema.safeParse(raw);
        return result.success ? result.data : null;
      }
    }
    return null;
  }

  async updatePinFailedAttempts(userId: string, count: number): Promise<void> {
    const db = await this.requireDb();
    const raw = await withStore(db, STORE_LOCAL_WRAPPER, 'readonly', (store) =>
      requestToPromise<unknown>(store.get(userId)),
    );
    if (
      raw !== null &&
      typeof raw === 'object' &&
      'method' in raw &&
      raw.method === 'pin'
    ) {
      await withStore(db, STORE_LOCAL_WRAPPER, 'readwrite', (store) =>
        requestToPromise(store.put({ ...raw, failedAttempts: count })),
      );
    }
  }

  async writeLocalWrapper(record: LocalWrapperRecord): Promise<void> {
    const db = await this.requireDb();
    await withStore(db, STORE_LOCAL_WRAPPER, 'readwrite', (store) =>
      requestToPromise(store.put(record)),
    );
  }

  async deleteLocalWrapper(userId: string): Promise<void> {
    const db = await this.requireDb();
    await withStore(db, STORE_LOCAL_WRAPPER, 'readwrite', (store) =>
      requestToPromise(store.delete(userId)),
    );
  }

  async clearSessionData(userId: string): Promise<void> {
    await this.deleteLocalWrapper(userId);
  }

  private async requireDb(): Promise<IDBDatabase> {
    await this.whenReady;
    if (this.db === null) throw new Error('KeysIndexeddb is closed');
    return this.db;
  }
}
