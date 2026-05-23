import { beforeEach, describe, expect, it } from 'vitest';

import {
  readCachedKeyRingProfile,
  writeCachedKeyRingProfile,
} from '../key-ring-cache';
import type { SerializedKeyRingProfile } from '../key-ring-record';

function makeRecord(userId = 'user-1'): SerializedKeyRingProfile {
  return {
    keyRing: {
      id: 'key-1',
      userId,
      activeDekId: 'dek-1',
      encryptionVersion: 1,
      encryptionAlgorithm: 'aes-256-gcm',
      iv: 'AAAAAAAAAAAAAAAA',
      ciphertext: 'AAAA',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    wrappers: [
      {
        id: 'wrapping-1',
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
        wrappingVersion: 1,
        wrappingAlgorithm: 'aes-256-gcm',
        wrappingParams: { ivBytes: 12, tagBits: 128 },
        wrappingIv: 'AAAAAAAAAAAAAAAA',
        ciphertext:
          'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  };
}

describe('key ring cache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writes and reads a valid per-user record', () => {
    const record = makeRecord();

    writeCachedKeyRingProfile('user-1', record);

    expect(readCachedKeyRingProfile('user-1')).toEqual(record);
    expect(readCachedKeyRingProfile('user-2')).toBeNull();
  });

  it('throws when writing a record for a different user', () => {
    expect(() =>
      writeCachedKeyRingProfile('user-2', makeRecord('user-1')),
    ).toThrow('Key ring profile user mismatch');
  });

  it('clears malformed json from cache', () => {
    localStorage.setItem('autokpo:e2ee:key-ring:user-1', '{not-json');

    expect(readCachedKeyRingProfile('user-1')).toBeNull();
    expect(localStorage.getItem('autokpo:e2ee:key-ring:user-1')).toBeNull();
  });

  it('clears structurally invalid records from cache', () => {
    localStorage.setItem(
      'autokpo:e2ee:key-ring:user-1',
      JSON.stringify({ ...makeRecord(), wrappers: [{ method: 'password' }] }),
    );

    expect(readCachedKeyRingProfile('user-1')).toBeNull();
    expect(localStorage.getItem('autokpo:e2ee:key-ring:user-1')).toBeNull();
  });
});
