import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { E2EE_KEY_RING_CACHE_NAME } from '../../pwa/sw-cache-names';
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
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('updates React Query and the protected service worker cache', async () => {
    const queryClient = new QueryClient();
    const profile = makeProfile();
    const put = vi.fn().mockResolvedValue(undefined);
    const open = vi.fn().mockResolvedValue({ put });
    vi.stubGlobal('caches', { open });

    await cacheKeyRingProfile(queryClient, 'user-1', profile);

    expect(
      queryClient.getQueryData(keyRingProfileQueryOptions('user-1').queryKey),
    ).toEqual(profile);
    expect(open).toHaveBeenCalledWith(E2EE_KEY_RING_CACHE_NAME);
    expect(put).toHaveBeenCalledTimes(1);

    const [request, response] = put.mock.calls[0] as [Request, Response];
    expect(new URL(request.url).pathname).toBe('/api/e2ee/key-ring');
    expect(await response.json()).toEqual(profile);
  });

  it('still updates React Query when CacheStorage is unavailable', async () => {
    const queryClient = new QueryClient();
    const profile = makeProfile();
    vi.stubGlobal('caches', undefined);

    await cacheKeyRingProfile(queryClient, 'user-1', profile);

    expect(
      queryClient.getQueryData(keyRingProfileQueryOptions('user-1').queryKey),
    ).toEqual(profile);
  });

  it('still updates React Query when CacheStorage write fails', async () => {
    const queryClient = new QueryClient();
    const profile = makeProfile();
    vi.stubGlobal('caches', {
      open: vi.fn().mockRejectedValue(new Error('cache unavailable')),
    });

    await cacheKeyRingProfile(queryClient, 'user-1', profile);

    expect(
      queryClient.getQueryData(keyRingProfileQueryOptions('user-1').queryKey),
    ).toEqual(profile);
  });
});
