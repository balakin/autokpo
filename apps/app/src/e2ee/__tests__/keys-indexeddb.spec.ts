import { afterEach, describe, expect, it } from 'vitest';

import { KDF_PARAMS_V1 } from '../key-ring-record';
import {
  KeysIndexeddb,
  type KeyRingRecord,
  type LocalWrapperRecord,
  type WrapperRecord,
} from '../keys-indexeddb';

const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';

const instances: KeysIndexeddb[] = [];

function makeStore(): KeysIndexeddb {
  const store = new KeysIndexeddb();
  instances.push(store);
  return store;
}

afterEach(() => {
  instances.splice(0).forEach((s) => s.close());
});

function makeKeyRingRecord(userId = USER_ID): KeyRingRecord {
  return {
    userId,
    keyRingId: 'kr-1',
    activeDekId: 'dek-1',
    encryptionVersion: 1,
    encryptionAlgorithm: 'aes-256-gcm',
    iv: 'base64iv==',
    ciphertext: 'base64ciphertext==',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeWrapperRecord(userId = USER_ID): WrapperRecord {
  return {
    userId,
    method: 'password',
    wrappingId: 'w-1',
    ciphertext: new Uint8Array(48).fill(1),
    wrappingIv: new Uint8Array(12).fill(2),
    wrappingAlgorithm: 'aes-256-gcm',
    wrappingVersion: 1,
    kdfAlgorithm: 'argon2id',
    kdfVersion: 1,
    kdfParams: KDF_PARAMS_V1,
    kdfSalt: new Uint8Array(16).fill(3),
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

async function makeLdkRecord(userId = USER_ID): Promise<LocalWrapperRecord> {
  const ldk = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  return {
    userId,
    method: 'ldk',
    wrapperId: 'wr-1',
    ldk,
    ciphertext: new Uint8Array(48).fill(4),
    wrappingIv: new Uint8Array(12).fill(5),
  };
}

describe('KeysIndexeddb — key_ring store', () => {
  it('returns null for a missing userId', async () => {
    const store = makeStore();
    await store.whenReady;
    expect(await store.readKeyRing(USER_ID)).toBeNull();
  });

  it('round-trips a key ring record', async () => {
    const store = makeStore();
    const record = makeKeyRingRecord();
    await store.writeKeyRing(record);
    expect(await store.readKeyRing(USER_ID)).toEqual(record);
  });

  it('isolates records by userId', async () => {
    const store = makeStore();
    await store.writeKeyRing(makeKeyRingRecord(USER_ID));
    expect(await store.readKeyRing(OTHER_USER_ID)).toBeNull();
  });

  it('overwrites an existing record on put', async () => {
    const store = makeStore();
    await store.writeKeyRing(makeKeyRingRecord());
    const updated = { ...makeKeyRingRecord(), activeDekId: 'dek-2' };
    await store.writeKeyRing(updated);
    expect(await store.readKeyRing(USER_ID)).toEqual(updated);
  });
});

describe('KeysIndexeddb — wrapper store', () => {
  it('returns null for a missing userId', async () => {
    const store = makeStore();
    await store.whenReady;
    expect(await store.readWrapper(USER_ID)).toBeNull();
  });

  it('round-trips a wrapper record with Uint8Array fields', async () => {
    const store = makeStore();
    const record = makeWrapperRecord();
    await store.writeWrapper(record);
    const stored = await store.readWrapper(USER_ID);
    expect(stored).toEqual(record);
    expect(stored?.ciphertext).toBeInstanceOf(Uint8Array);
    expect(stored?.wrappingIv).toBeInstanceOf(Uint8Array);
    expect(stored?.kdfSalt).toBeInstanceOf(Uint8Array);
  });

  it('isolates records by userId', async () => {
    const store = makeStore();
    await store.writeWrapper(makeWrapperRecord(USER_ID));
    expect(await store.readWrapper(OTHER_USER_ID)).toBeNull();
  });
});

describe('KeysIndexeddb — local_wrapper store', () => {
  it('returns null for a missing userId', async () => {
    const store = makeStore();
    await store.whenReady;
    expect(await store.readLocalWrapper(USER_ID)).toBeNull();
  });

  it('round-trips an LDK record and CryptoKey survives the round-trip', async () => {
    const store = makeStore();
    const record = await makeLdkRecord();
    await store.writeLocalWrapper(record);
    const stored = await store.readLocalWrapper(USER_ID);
    expect(stored).not.toBeNull();
    expect(stored?.method).toBe('ldk');
    expect(stored?.ldk).toBeInstanceOf(CryptoKey);
    expect(stored?.ciphertext).toBeInstanceOf(Uint8Array);
    expect(stored?.wrappingIv).toBeInstanceOf(Uint8Array);
  });

  it('deleteLocalWrapper removes the record', async () => {
    const store = makeStore();
    await store.writeLocalWrapper(await makeLdkRecord());
    await store.deleteLocalWrapper(USER_ID);
    expect(await store.readLocalWrapper(USER_ID)).toBeNull();
  });

  it('deleteLocalWrapper is a no-op for a missing userId', async () => {
    const store = makeStore();
    await store.whenReady;
    await expect(store.deleteLocalWrapper(USER_ID)).resolves.toBeUndefined();
  });
});

describe('KeysIndexeddb — clearSessionData', () => {
  it('deletes only the local_wrapper record for the userId', async () => {
    const store = makeStore();
    await store.writeKeyRing(makeKeyRingRecord());
    await store.writeWrapper(makeWrapperRecord());
    await store.writeLocalWrapper(await makeLdkRecord());

    await store.clearSessionData(USER_ID);

    expect(await store.readLocalWrapper(USER_ID)).toBeNull();
    expect(await store.readKeyRing(USER_ID)).not.toBeNull();
    expect(await store.readWrapper(USER_ID)).not.toBeNull();
  });

  it('does not delete records for other users', async () => {
    const store = makeStore();
    await store.writeLocalWrapper(await makeLdkRecord(OTHER_USER_ID));
    await store.clearSessionData(USER_ID);
    expect(await store.readLocalWrapper(OTHER_USER_ID)).not.toBeNull();
  });
});
