import { beforeEach, describe, expect, it } from 'vitest';

import {
  readCachedEncryptionKeyRecord,
  writeCachedEncryptionKeyRecord,
} from '../encryption-key-cache';
import type { SerializedEncryptionKeyRecord } from '../encryption-key-record';

function makeRecord(userId = 'user-1'): SerializedEncryptionKeyRecord {
  return {
    version: 1,
    key: {
      id: 'key-1',
      userId,
      createdAt: '2026-01-01T00:00:00.000Z',
      revokedAt: null,
    },
    wrapping: {
      id: 'wrapping-1',
      keyId: 'key-1',
      userId,
      method: 'password',
      kdfVersion: 1,
      kdfAlgorithm: 'argon2id',
      kdfParams: {
        memorySize: 65536,
        iterations: 3,
        parallelism: 1,
        hashLength: 32,
      },
      kdfSalt: 'AAAAAAAAAAAAAAAAAAAAAA==',
      wrapVersion: 1,
      wrapAlgorithm: 'aes-256-gcm',
      wrapParams: { ivBytes: 12, tagBits: 128 },
      wrapIv: 'AAAAAAAAAAAAAAAA',
      wrappedMasterKey:
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      createdAt: '2026-01-01T00:00:00.000Z',
      revokedAt: null,
    },
  };
}

describe('encryption key cache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writes and reads a valid per-user record', () => {
    const record = makeRecord();

    writeCachedEncryptionKeyRecord('user-1', record);

    expect(readCachedEncryptionKeyRecord('user-1')).toEqual(record);
    expect(readCachedEncryptionKeyRecord('user-2')).toBeNull();
  });

  it('throws when writing a record for a different user', () => {
    expect(() =>
      writeCachedEncryptionKeyRecord('user-2', makeRecord('user-1')),
    ).toThrow('Encryption key record user mismatch');
  });

  it('clears malformed json from cache', () => {
    localStorage.setItem('autokpo:e2ee:wrapped-key:user-1', '{not-json');

    expect(readCachedEncryptionKeyRecord('user-1')).toBeNull();
    expect(localStorage.getItem('autokpo:e2ee:wrapped-key:user-1')).toBeNull();
  });

  it('clears structurally invalid records from cache', () => {
    localStorage.setItem(
      'autokpo:e2ee:wrapped-key:user-1',
      JSON.stringify({ ...makeRecord(), wrapping: { method: 'password' } }),
    );

    expect(readCachedEncryptionKeyRecord('user-1')).toBeNull();
    expect(localStorage.getItem('autokpo:e2ee:wrapped-key:user-1')).toBeNull();
  });
});
