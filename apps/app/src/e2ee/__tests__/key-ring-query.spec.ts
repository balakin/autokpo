import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import {
  cacheKeyRingProfile,
  keyRingProfileQueryOptions,
} from '../key-ring-query';
import type { SerializedKeyRingProfile } from '../key-ring-record';

function makeProfile(): SerializedKeyRingProfile {
  return {
    keyRing: {
      id: 'key-ring-1',
      userId: 'user-1',
      activeDekId: 'dek-1',
      revision: 1,
      plaintextSchemaVersion: 1,
      encryptionAlgorithm: 'aes-256-gcm',
      encryptionParams: { iv: 'iv', tagBits: 128 },
      ciphertext: 'ciphertext',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    wrappers: [
      {
        id: 'wrapping-1',
        userId: 'user-1',
        method: 'password',
        kdfAlgorithm: 'argon2id',
        kdfParams: {
          memorySize: 65536,
          iterations: 3,
          parallelism: 1,
          hashLength: 32,
        },
        kdfSalt: 'salt',
        wrappingAlgorithm: 'aes-256-gcm',
        wrappingParams: { iv: 'iv', tagBits: 128 },
        ciphertext: 'wrapped-mek',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  };
}

describe('cacheKeyRingProfile', () => {
  it('updates React Query cache with the provided profile', () => {
    const queryClient = new QueryClient();
    const profile = makeProfile();

    cacheKeyRingProfile(queryClient, 'user-1', profile);

    expect(
      queryClient.getQueryData(keyRingProfileQueryOptions('user-1').queryKey),
    ).toEqual(profile);
  });

  it('scopes data to the correct userId query key', () => {
    const queryClient = new QueryClient();
    const profile = makeProfile();

    cacheKeyRingProfile(queryClient, 'user-1', profile);

    expect(
      queryClient.getQueryData(keyRingProfileQueryOptions('user-2').queryKey),
    ).toBeUndefined();
  });
});
