import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  changeMasterPassword,
  KeyRingConflictError,
  updateKeyRingProfile,
} from '../key-ring-api';
import { KDF_PARAMS_V1 } from '../key-ring-record';

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
      kdfAlgorithm: 'argon2id' as const,
      kdfParams: KDF_PARAMS_V1,
      kdfSalt: 'salt',
      wrappingAlgorithm: 'aes-256-gcm' as const,
      wrappingParams: { iv: 'iv', tagBits: 128 },
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
        kdfAlgorithm: 'argon2id',
        kdfParams: KDF_PARAMS_V1,
        kdfSalt: 'salt',
        wrappingAlgorithm: 'aes-256-gcm',
        wrappingParams: { iv: 'iv', tagBits: 128 },
        ciphertext: 'ciphertext',
      }),
    ).rejects.toBeInstanceOf(KeyRingConflictError);
  });

  it('puts key ring update request JSON and decodes profile response', async () => {
    const profile = {
      keyRing: {
        id: 'key-ring-1',
        userId: 'user-1',
        activeDekId: 'dek-1',
        revision: 2,
        encryptionAlgorithm: 'aes-256-gcm',
        encryptionParams: { iv: 'iv', tagBits: 128 },
        ciphertext: 'ciphertext',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      wrappers: [
        {
          id: 'wrapper-1',
          userId: 'user-1',
          method: 'password',
          kdfAlgorithm: 'argon2id',
          kdfParams: KDF_PARAMS_V1,
          kdfSalt: 'salt',
          wrappingAlgorithm: 'aes-256-gcm',
          wrappingParams: { iv: 'iv', tagBits: 128 },
          ciphertext: 'ciphertext',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    };
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json(profile));
    const request = {
      currentRevision: 1,
      activeDekId: 'dek-1',
      encryptionAlgorithm: 'aes-256-gcm' as const,
      encryptionParams: { iv: 'iv', tagBits: 128 },
      ciphertext: 'ciphertext',
    };

    await expect(updateKeyRingProfile(request)).resolves.toEqual(profile);

    expect(fetchMock).toHaveBeenCalledWith('/api/e2ee/key-ring', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  });

  it('throws conflict error for stale key ring revision response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ code: 'key_ring_revision_conflict' }, { status: 409 }),
    );

    await expect(
      updateKeyRingProfile({
        currentRevision: 1,
        activeDekId: 'dek-1',
        encryptionAlgorithm: 'aes-256-gcm',
        encryptionParams: { iv: 'iv', tagBits: 128 },
        ciphertext: 'ciphertext',
      }),
    ).rejects.toBeInstanceOf(KeyRingConflictError);
  });
});
