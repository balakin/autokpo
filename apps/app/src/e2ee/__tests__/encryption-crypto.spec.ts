import { describe, expect, it, vi } from 'vitest';

import type { createWrappedMasterKey } from '../encryption-crypto';
import {
  readCachedEncryptionKeyRecord,
  writeCachedEncryptionKeyRecord,
} from '../encryption-key-cache';
import type { SerializedEncryptionKeyRecord } from '../encryption-key-record';

const deriveKekMock = vi.hoisted(() => vi.fn());

vi.mock('../kdf', () => ({ deriveKek: deriveKekMock }));

function makeRecord(
  request: Awaited<ReturnType<typeof createWrappedMasterKey>>['request'],
  userId = 'user-1',
): SerializedEncryptionKeyRecord {
  return {
    version: 1,
    key: {
      id: request.keyId,
      userId,
      createdAt: '2026-01-01T00:00:00.000Z',
      revokedAt: null,
    },
    wrapping: {
      id: request.wrappingId,
      keyId: request.keyId,
      userId,
      method: 'password',
      kdfVersion: request.kdfVersion,
      kdfAlgorithm: request.kdfAlgorithm,
      kdfParams: request.kdfParams,
      kdfSalt: request.kdfSalt,
      wrapVersion: request.wrapVersion,
      wrapAlgorithm: request.wrapAlgorithm,
      wrapParams: request.wrapParams,
      wrapIv: request.wrapIv,
      wrappedMasterKey: request.wrappedMasterKey,
      createdAt: '2026-01-01T00:00:00.000Z',
      revokedAt: null,
    },
  };
}

describe('encryption crypto helpers', () => {
  it('wraps and unwraps a master key with matching password and AAD', async () => {
    deriveKekMock.mockResolvedValue(new Uint8Array(32).fill(7));
    const { createWrappedMasterKey, unwrapMasterKey } =
      await import('../encryption-crypto');

    const { request, masterKey } = await createWrappedMasterKey(
      'user-1',
      'correct-password',
    );
    const unwrapped = await unwrapMasterKey(
      'correct-password',
      makeRecord(request),
    );

    expect(unwrapped).toEqual(masterKey);
  });

  it('rejects wrong password-derived keys', async () => {
    const { createWrappedMasterKey, unwrapMasterKey } =
      await import('../encryption-crypto');
    deriveKekMock.mockResolvedValueOnce(new Uint8Array(32).fill(7));
    const { request } = await createWrappedMasterKey(
      'user-1',
      'correct-password',
    );
    deriveKekMock.mockResolvedValueOnce(new Uint8Array(32).fill(8));

    await expect(
      unwrapMasterKey('wrong-password', makeRecord(request)),
    ).rejects.toThrow('Failed to unwrap master key');
  });

  it('rejects AAD metadata mismatch', async () => {
    const { createWrappedMasterKey, unwrapMasterKey } =
      await import('../encryption-crypto');
    deriveKekMock.mockResolvedValue(new Uint8Array(32).fill(7));
    const { request } = await createWrappedMasterKey('user-1', 'password');
    const record = makeRecord(request);
    record.wrapping.id = 'different-wrapping';

    await expect(unwrapMasterKey('password', record)).rejects.toThrow(
      'Failed to unwrap master key',
    );
  });
});

describe('wrapped key cache', () => {
  it('round-trips valid per-user wrapped key records', async () => {
    const { createWrappedMasterKey } = await import('../encryption-crypto');
    deriveKekMock.mockResolvedValue(new Uint8Array(32).fill(7));
    const { request } = await createWrappedMasterKey('user-1', 'password');
    const record = makeRecord(request);

    writeCachedEncryptionKeyRecord('user-1', record);

    expect(readCachedEncryptionKeyRecord('user-1')).toEqual(record);
    expect(readCachedEncryptionKeyRecord('user-2')).toBeNull();
  });
});
