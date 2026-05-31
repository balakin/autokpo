import { afterEach, describe, expect, it } from 'vitest';

import { KDF_PARAMS_V1 } from '../key-ring-record';
import {
  KeysIndexeddb,
  type LocalWrapperRecord,
  type LocalWrapperRecordPin,
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
    wrappingAlgorithm: 'aes-256-gcm',
    wrappingParams: { iv: new Uint8Array(12).fill(5), tagBits: 128 },
  };
}

async function makePinRecord(userId = USER_ID): Promise<LocalWrapperRecordPin> {
  const pinLdk = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  return {
    userId,
    method: 'pin',
    wrapperId: 'wr-pin-1',
    pinLdk,
    pinSaltCiphertext: new Uint8Array(32).fill(6),
    pinSaltAlgorithm: 'aes-256-gcm',
    pinSaltParams: { iv: new Uint8Array(12).fill(7), tagBits: 128 },
    kdfAlgorithm: 'argon2id',
    kdfParams: KDF_PARAMS_V1,
    wrappingAlgorithm: 'aes-256-gcm',
    wrappingParams: { iv: new Uint8Array(12).fill(9), tagBits: 128 },
    ciphertext: new Uint8Array(48).fill(8),
    createdAt: '2026-01-01T00:00:00.000Z',
    failedAttempts: 0,
  };
}

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
    if (!stored || stored.method !== 'ldk')
      throw new Error('expected ldk record');
    expect(stored.ldk).toBeInstanceOf(CryptoKey);
    expect(stored.ciphertext).toBeInstanceOf(Uint8Array);
    expect(stored.wrappingParams.iv).toBeInstanceOf(Uint8Array);
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

  it('round-trips a PIN record and CryptoKey survives the round-trip', async () => {
    const store = makeStore();
    const record = await makePinRecord();
    await store.writeLocalWrapper(record);
    const stored = await store.readLocalWrapper(USER_ID);
    expect(stored).not.toBeNull();
    expect(stored?.method).toBe('pin');
    if (stored?.method !== 'pin') return;
    expect(stored.pinLdk).toBeInstanceOf(CryptoKey);
    expect(stored.pinSaltCiphertext).toBeInstanceOf(Uint8Array);
    expect(stored.pinSaltParams.iv).toBeInstanceOf(Uint8Array);
    expect(stored.ciphertext).toBeInstanceOf(Uint8Array);
    expect(stored.wrappingParams.iv).toBeInstanceOf(Uint8Array);
    expect(stored.failedAttempts).toBe(0);
    expect(stored.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('writing a PIN record overwrites an existing LDK record', async () => {
    const store = makeStore();
    await store.writeLocalWrapper(await makeLdkRecord());
    await store.writeLocalWrapper(await makePinRecord());
    const stored = await store.readLocalWrapper(USER_ID);
    expect(stored?.method).toBe('pin');
  });

  it('updatePinFailedAttempts increments the counter on an existing PIN record', async () => {
    const store = makeStore();
    await store.writeLocalWrapper(await makePinRecord());
    await store.updatePinFailedAttempts(USER_ID, 3);
    const stored = await store.readLocalWrapper(USER_ID);
    if (stored?.method !== 'pin') throw new Error('expected pin');
    expect(stored.failedAttempts).toBe(3);
  });

  it('updatePinFailedAttempts is a no-op for a non-pin record', async () => {
    const store = makeStore();
    await store.writeLocalWrapper(await makeLdkRecord());
    await expect(
      store.updatePinFailedAttempts(USER_ID, 3),
    ).resolves.toBeUndefined();
    expect((await store.readLocalWrapper(USER_ID))?.method).toBe('ldk');
  });
});

describe('KeysIndexeddb — clearSessionData', () => {
  it('deletes the local_wrapper record for the userId', async () => {
    const store = makeStore();
    await store.writeLocalWrapper(await makeLdkRecord());

    await store.clearSessionData(USER_ID);

    expect(await store.readLocalWrapper(USER_ID)).toBeNull();
  });

  it('does not delete records for other users', async () => {
    const store = makeStore();
    await store.writeLocalWrapper(await makeLdkRecord(OTHER_USER_ID));
    await store.clearSessionData(USER_ID);
    expect(await store.readLocalWrapper(OTHER_USER_ID)).not.toBeNull();
  });
});
