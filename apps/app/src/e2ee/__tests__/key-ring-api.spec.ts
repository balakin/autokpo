import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  changeMasterPassword,
  KeyRingConflictError,
  updateKeyRingProfile,
} from '../key-ring-api';
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

  it('puts key ring update request JSON and decodes profile response', async () => {
    const profile = {
      keyRing: {
        id: 'key-ring-1',
        userId: 'user-1',
        activeDekId: 'dek-1',
        revision: 2,
        encryptionVersion: 1,
        encryptionAlgorithm: 'aes-256-gcm',
        iv: 'iv',
        ciphertext: 'ciphertext',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      wrappers: [
        {
          id: 'wrapper-1',
          userId: 'user-1',
          method: 'password',
          kdfVersion: 1,
          kdfAlgorithm: 'argon2id',
          kdfParams: KDF_PARAMS_V1,
          kdfSalt: 'salt',
          wrappingVersion: 1,
          wrappingAlgorithm: 'aes-256-gcm',
          wrappingParams: WRAPPING_PARAMS_V1,
          wrappingIv: 'iv',
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
      encryptionVersion: 1 as const,
      encryptionAlgorithm: 'aes-256-gcm' as const,
      keyRingIv: 'iv',
      keyRingCiphertext: 'ciphertext',
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
        encryptionVersion: 1,
        encryptionAlgorithm: 'aes-256-gcm',
        keyRingIv: 'iv',
        keyRingCiphertext: 'ciphertext',
      }),
    ).rejects.toBeInstanceOf(KeyRingConflictError);
  });
});
