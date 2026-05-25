import { afterEach, describe, expect, it, vi } from 'vitest';

import { changeMasterPassword, KeyRingConflictError } from '../key-ring-api';
import { KDF_PARAMS_V1, WRAPPING_PARAMS_V1 } from '../key-ring-record';

describe('key ring api', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts change master password request JSON', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    const request = {
      currentWrappingId: 'old-wrapper',
      wrappingId: 'new-wrapper',
      kdfVersion: 1 as const,
      kdfAlgorithm: 'argon2id' as const,
      kdfParams: KDF_PARAMS_V1,
      kdfSalt: 'salt',
      wrappingVersion: 1 as const,
      wrappingAlgorithm: 'aes-256-gcm' as const,
      wrappingParams: WRAPPING_PARAMS_V1,
      wrappingIv: 'iv',
      ciphertext: 'ciphertext',
    };

    await changeMasterPassword(request);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/e2ee/key-ring/change-password',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      },
    );
  });

  it('throws conflict error for stale wrapper response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 409 }),
    );

    await expect(
      changeMasterPassword({
        currentWrappingId: 'old-wrapper',
        wrappingId: 'new-wrapper',
        kdfVersion: 1,
        kdfAlgorithm: 'argon2id',
        kdfParams: KDF_PARAMS_V1,
        kdfSalt: 'salt',
        wrappingVersion: 1,
        wrappingAlgorithm: 'aes-256-gcm',
        wrappingParams: WRAPPING_PARAMS_V1,
        wrappingIv: 'iv',
        ciphertext: 'ciphertext',
      }),
    ).rejects.toBeInstanceOf(KeyRingConflictError);
  });
});
