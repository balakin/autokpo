import { describe, expect, it, vi } from 'vitest';

import { aesGcmEncrypt } from '../aes-gcm';
import { base64ToBytes, bytesToBase64 } from '../base64';
import type { createKeyRingProfilePayload } from '../encryption-crypto';
import {
  AES_GCM_PARAMS_V1,
  KDF_PARAMS_V1,
  type SerializedKeyRingProfile,
} from '../key-ring-record';

const deriveKekMock = vi.hoisted(() => vi.fn());

vi.mock('../kdf', () => ({ deriveKek: deriveKekMock }));

function makeRecord(
  request: Awaited<ReturnType<typeof createKeyRingProfilePayload>>['request'],
  userId = 'user-1',
): SerializedKeyRingProfile {
  return {
    keyRing: {
      id: request.keyRingId,
      userId,
      activeDekId: request.activeDekId,
      revision: 1,
      encryptionAlgorithm: 'aes-256-gcm',
      encryptionParams: request.keyRing.encryptionParams,
      ciphertext: request.keyRing.ciphertext,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    wrappers: [
      {
        id: request.wrappingId,
        userId,
        method: 'password',
        kdfAlgorithm: request.mek.kdfAlgorithm,
        kdfParams: request.mek.kdfParams,
        kdfSalt: request.mek.kdfSalt,
        wrappingAlgorithm: request.mek.wrappingAlgorithm,
        wrappingParams: request.mek.wrappingParams,
        ciphertext: request.mek.ciphertext,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  };
}

async function makeRecordWithPlaintextKeyRing(
  keyRingPlaintext: unknown,
): Promise<SerializedKeyRingProfile> {
  const { keyRingAad, wrappedMekAad } = await import('../encryption-crypto');
  const userId = 'user-1';
  const activeDekId = 'dek-1';
  const revision = 1;
  const wrappingId = 'wrapping-1';
  const mek = new Uint8Array(32).fill(9);
  const kek = new Uint8Array(32).fill(7);
  const keyRingIv = new Uint8Array(12).fill(1);
  const wrappingIv = new Uint8Array(12).fill(2);

  const keyRingCiphertext = await aesGcmEncrypt({
    keyBytes: mek,
    params: { iv: keyRingIv, tagBits: AES_GCM_PARAMS_V1.tagBits },
    plaintext: new TextEncoder().encode(JSON.stringify(keyRingPlaintext)),
    aad: keyRingAad(userId, activeDekId, revision),
  });
  const wrappedMek = await aesGcmEncrypt({
    keyBytes: kek,
    params: { iv: wrappingIv, tagBits: AES_GCM_PARAMS_V1.tagBits },
    plaintext: mek,
    aad: wrappedMekAad(userId, wrappingId, 'password'),
  });

  return {
    keyRing: {
      id: 'key-ring-1',
      userId,
      activeDekId,
      revision,
      encryptionAlgorithm: 'aes-256-gcm',
      encryptionParams: {
        iv: bytesToBase64(keyRingIv),
        tagBits: AES_GCM_PARAMS_V1.tagBits,
      },
      ciphertext: bytesToBase64(keyRingCiphertext),
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    wrappers: [
      {
        id: wrappingId,
        userId,
        method: 'password',
        kdfAlgorithm: 'argon2id',
        kdfParams: KDF_PARAMS_V1,
        kdfSalt: bytesToBase64(new Uint8Array(16).fill(3)),
        wrappingAlgorithm: 'aes-256-gcm',
        wrappingParams: {
          iv: bytesToBase64(wrappingIv),
          tagBits: AES_GCM_PARAMS_V1.tagBits,
        },
        ciphertext: bytesToBase64(wrappedMek),
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  };
}

describe('encryption crypto helpers', () => {
  it('wraps and unwraps a key ring with matching password and AAD', async () => {
    deriveKekMock.mockResolvedValue(new Uint8Array(32).fill(7));
    const { createKeyRingProfilePayload, unwrapKeyRingProfile } =
      await import('../encryption-crypto');

    const { request } = await createKeyRingProfilePayload(
      'user-1',
      'correct-password',
    );
    const unwrapped = await unwrapKeyRingProfile(
      'correct-password',
      makeRecord(request),
    );

    expect(unwrapped.activeDekId).toBe(request.activeDekId);
    expect(unwrapped.activeDek).toHaveLength(32);
  });

  it('binds key ring ciphertext to revision through AAD', async () => {
    const { createKeyRingProfilePayload, unwrapKeyRingProfile } =
      await import('../encryption-crypto');
    deriveKekMock.mockResolvedValue(new Uint8Array(32).fill(7));
    const { request } = await createKeyRingProfilePayload('user-1', 'password');
    const record = makeRecord(request);
    record.keyRing.revision = 2;

    await expect(unwrapKeyRingProfile('password', record)).rejects.toThrow(
      'Failed to unlock key ring',
    );
  });

  it('rejects wrong password-derived keys', async () => {
    const { createKeyRingProfilePayload, unwrapKeyRingProfile } =
      await import('../encryption-crypto');
    deriveKekMock.mockResolvedValueOnce(new Uint8Array(32).fill(7));
    const { request } = await createKeyRingProfilePayload(
      'user-1',
      'correct-password',
    );
    deriveKekMock.mockResolvedValueOnce(new Uint8Array(32).fill(8));

    await expect(
      unwrapKeyRingProfile('wrong-password', makeRecord(request)),
    ).rejects.toThrow('Failed to unlock key ring');
  });

  it('rejects AAD metadata mismatch', async () => {
    const { createKeyRingProfilePayload, unwrapKeyRingProfile } =
      await import('../encryption-crypto');
    deriveKekMock.mockResolvedValue(new Uint8Array(32).fill(7));
    const { request } = await createKeyRingProfilePayload('user-1', 'password');
    const record = makeRecord(request);
    record.wrappers[0].id = 'different-wrapping';

    await expect(unwrapKeyRingProfile('password', record)).rejects.toThrow(
      'Failed to unlock key ring',
    );
  });

  it('rejects non-key-material DEK entries in plaintext key rings', async () => {
    const { unwrapKeyRingProfile } = await import('../encryption-crypto');
    deriveKekMock.mockResolvedValue(new Uint8Array(32).fill(7));
    const record = await makeRecordWithPlaintextKeyRing({
      version: 1,
      revision: 1,
      activeDekId: 'dek-1',
      deks: {
        'dek-1': {
          algorithm: 'aes-256-gcm',
          key: bytesToBase64(new Uint8Array(32).fill(4)),
        },
      },
    });

    await expect(unwrapKeyRingProfile('password', record)).rejects.toThrow(
      'Failed to unlock key ring',
    );
  });

  it('rejects malformed active DEK bytes in plaintext key rings', async () => {
    const { unwrapKeyRingProfile } = await import('../encryption-crypto');
    deriveKekMock.mockResolvedValue(new Uint8Array(32).fill(7));
    const record = await makeRecordWithPlaintextKeyRing({
      version: 1,
      revision: 1,
      activeDekId: 'dek-1',
      deks: {
        'dek-1': bytesToBase64(new Uint8Array(16).fill(4)),
      },
    });

    await expect(unwrapKeyRingProfile('password', record)).rejects.toThrow(
      'Failed to unlock key ring',
    );
  });

  it('rejects plaintext revision mismatch after decrypting key rings', async () => {
    const { unwrapKeyRingProfile } = await import('../encryption-crypto');
    deriveKekMock.mockResolvedValue(new Uint8Array(32).fill(7));
    const record = await makeRecordWithPlaintextKeyRing({
      version: 1,
      revision: 2,
      activeDekId: 'dek-1',
      deks: {
        'dek-1': bytesToBase64(new Uint8Array(32).fill(4)),
      },
    });

    await expect(unwrapKeyRingProfile('password', record)).rejects.toThrow(
      'Failed to unlock key ring',
    );
  });

  it('rejects plaintext active DEK mismatch after decrypting key rings', async () => {
    const { unwrapKeyRingProfile } = await import('../encryption-crypto');
    deriveKekMock.mockResolvedValue(new Uint8Array(32).fill(7));
    const record = await makeRecordWithPlaintextKeyRing({
      version: 1,
      revision: 1,
      activeDekId: 'other-dek',
      deks: {
        'other-dek': bytesToBase64(new Uint8Array(32).fill(4)),
      },
    });

    await expect(unwrapKeyRingProfile('password', record)).rejects.toThrow(
      'Failed to unlock key ring',
    );
  });

  it('creates a replacement password wrapper for the existing MEK', async () => {
    deriveKekMock.mockResolvedValue(new Uint8Array(32).fill(7));
    const { createPasswordWrapperPayload, wrappedMekAad } =
      await import('../encryption-crypto');
    const { aesGcmDecrypt } = await import('../aes-gcm');
    const mek = new Uint8Array(32).fill(9);

    const request = await createPasswordWrapperPayload(
      'user-1',
      'old-wrapper-id',
      mek,
      'same-or-new-password',
    );

    expect(request.currentWrappingId).toBe('old-wrapper-id');
    expect(request.kdfParams).toEqual(KDF_PARAMS_V1);
    expect(request.wrappingParams).toEqual(
      AES_GCM_PARAMS_V1.tagBits
        ? expect.objectContaining({ tagBits: AES_GCM_PARAMS_V1.tagBits })
        : undefined,
    );
    expect(base64ToBytes(request.kdfSalt)).toHaveLength(16);
    expect(base64ToBytes(request.wrappingParams.iv)).toHaveLength(12);
    const unwrapped = await aesGcmDecrypt({
      keyBytes: new Uint8Array(32).fill(7),
      params: {
        iv: base64ToBytes(request.wrappingParams.iv),
        tagBits: request.wrappingParams.tagBits,
      },
      ciphertext: base64ToBytes(request.ciphertext),
      aad: wrappedMekAad('user-1', request.wrappingId, 'password'),
    });
    expect(unwrapped).toEqual(mek);
  });

  it('replacement password wrapper is bound to the new wrapper id', async () => {
    deriveKekMock.mockResolvedValue(new Uint8Array(32).fill(7));
    const { createPasswordWrapperPayload, wrappedMekAad } =
      await import('../encryption-crypto');
    const { aesGcmDecrypt } = await import('../aes-gcm');
    const request = await createPasswordWrapperPayload(
      'user-1',
      'old-wrapper-id',
      new Uint8Array(32).fill(9),
      'password',
    );

    await expect(
      aesGcmDecrypt({
        keyBytes: new Uint8Array(32).fill(7),
        params: {
          iv: base64ToBytes(request.wrappingParams.iv),
          tagBits: request.wrappingParams.tagBits,
        },
        ciphertext: base64ToBytes(request.ciphertext),
        aad: wrappedMekAad('user-1', 'different-wrapper-id', 'password'),
      }),
    ).rejects.toThrow();
  });
});

describe('PIN crypto operations', () => {
  it('pinSaltAad returns a deterministic AAD bound to userId and wrapperId', async () => {
    const { pinSaltAad } = await import('../encryption-crypto');
    const aad = pinSaltAad('user-1', 'wrapper-1');
    expect(new TextDecoder().decode(aad)).toBe(
      'autokpo:e2ee-pin-salt:v1:user-1:wrapper-1',
    );
  });

  it('pinSaltAad differs for different userId or wrapperId', async () => {
    const { pinSaltAad } = await import('../encryption-crypto');
    const a = pinSaltAad('user-1', 'w-1');
    const b = pinSaltAad('user-2', 'w-1');
    const c = pinSaltAad('user-1', 'w-2');
    expect(a).not.toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('wrapMekWithPin and unwrapMekWithPin round-trip the MEK', async () => {
    deriveKekMock.mockImplementation((_pin: string, salt: Uint8Array) =>
      Promise.resolve(new Uint8Array(32).fill(salt[0])),
    );
    const { wrapMekWithPin, unwrapMekWithPin } =
      await import('../encryption-crypto');
    const mek = crypto.getRandomValues(new Uint8Array(32));
    const userId = 'user-1';
    const wrapperId = crypto.randomUUID();

    const fields = await wrapMekWithPin(mek, '123456', userId, wrapperId);
    expect(fields.pinLdk).toBeInstanceOf(CryptoKey);
    expect(fields.pinLdk.extractable).toBe(false);

    const recovered = await unwrapMekWithPin(
      { ...fields, userId, wrapperId },
      '123456',
    );
    expect(recovered).toEqual(mek);
  });

  it('unwrapMekWithPin throws EncryptionUnlockError on wrong PIN', async () => {
    deriveKekMock
      .mockResolvedValueOnce(new Uint8Array(32).fill(1))
      .mockResolvedValueOnce(new Uint8Array(32).fill(2));
    const { wrapMekWithPin, unwrapMekWithPin, EncryptionUnlockError } =
      await import('../encryption-crypto');
    const mek = crypto.getRandomValues(new Uint8Array(32));
    const userId = 'user-1';
    const wrapperId = crypto.randomUUID();

    const fields = await wrapMekWithPin(mek, '123456', userId, wrapperId);

    await expect(
      unwrapMekWithPin({ ...fields, userId, wrapperId }, '000000'),
    ).rejects.toBeInstanceOf(EncryptionUnlockError);
  });

  it('unwrapMekWithPin throws EncryptionUnlockError on wrong userId (AAD mismatch)', async () => {
    deriveKekMock.mockResolvedValue(new Uint8Array(32).fill(5));
    const { wrapMekWithPin, unwrapMekWithPin, EncryptionUnlockError } =
      await import('../encryption-crypto');
    const mek = crypto.getRandomValues(new Uint8Array(32));
    const wrapperId = crypto.randomUUID();

    const fields = await wrapMekWithPin(mek, '123456', 'user-1', wrapperId);

    await expect(
      unwrapMekWithPin({ ...fields, userId: 'user-2', wrapperId }, '123456'),
    ).rejects.toBeInstanceOf(EncryptionUnlockError);
  });
});

describe('LDK crypto operations', () => {
  it('generateLdk produces a non-extractable AES-GCM CryptoKey', async () => {
    const { generateLdk } = await import('../encryption-crypto');
    const ldk = await generateLdk();
    expect(ldk).toBeInstanceOf(CryptoKey);
    expect(ldk.type).toBe('secret');
    expect(ldk.extractable).toBe(false);
    expect(ldk.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
    expect(ldk.usages).toContain('encrypt');
    expect(ldk.usages).toContain('decrypt');
  });

  it('wrapMekWithLdk and unwrapMekWithLdk round-trip the MEK', async () => {
    const { generateLdk, wrapMekWithLdk, unwrapMekWithLdk } =
      await import('../encryption-crypto');
    const ldk = await generateLdk();
    const mek = crypto.getRandomValues(new Uint8Array(32));
    const userId = 'user-1';
    const wrapperId = 'wrapper-1';

    const { ciphertext, wrappingParams } = await wrapMekWithLdk(
      mek,
      ldk,
      userId,
      wrapperId,
    );
    const recovered = await unwrapMekWithLdk(
      ciphertext,
      wrappingParams,
      ldk,
      userId,
      wrapperId,
    );

    expect(recovered).toEqual(mek);
  });

  it('unwrapMekWithLdk throws EncryptionUnlockError on wrong LDK', async () => {
    const {
      generateLdk,
      wrapMekWithLdk,
      unwrapMekWithLdk,
      EncryptionUnlockError,
    } = await import('../encryption-crypto');
    const ldk = await generateLdk();
    const wrongLdk = await generateLdk();
    const mek = crypto.getRandomValues(new Uint8Array(32));

    const { ciphertext, wrappingParams } = await wrapMekWithLdk(
      mek,
      ldk,
      'user-1',
      'w-1',
    );

    await expect(
      unwrapMekWithLdk(ciphertext, wrappingParams, wrongLdk, 'user-1', 'w-1'),
    ).rejects.toBeInstanceOf(EncryptionUnlockError);
  });

  it('unwrapMekWithLdk throws EncryptionUnlockError on AAD mismatch (different userId)', async () => {
    const {
      generateLdk,
      wrapMekWithLdk,
      unwrapMekWithLdk,
      EncryptionUnlockError,
    } = await import('../encryption-crypto');
    const ldk = await generateLdk();
    const mek = crypto.getRandomValues(new Uint8Array(32));

    const { ciphertext, wrappingParams } = await wrapMekWithLdk(
      mek,
      ldk,
      'user-1',
      'w-1',
    );

    await expect(
      unwrapMekWithLdk(ciphertext, wrappingParams, ldk, 'user-2', 'w-1'),
    ).rejects.toBeInstanceOf(EncryptionUnlockError);
  });

  it('unwrapMekWithLdk throws EncryptionUnlockError on AAD mismatch (different wrapperId)', async () => {
    const {
      generateLdk,
      wrapMekWithLdk,
      unwrapMekWithLdk,
      EncryptionUnlockError,
    } = await import('../encryption-crypto');
    const ldk = await generateLdk();
    const mek = crypto.getRandomValues(new Uint8Array(32));

    const { ciphertext, wrappingParams } = await wrapMekWithLdk(
      mek,
      ldk,
      'user-1',
      'w-1',
    );

    await expect(
      unwrapMekWithLdk(ciphertext, wrappingParams, ldk, 'user-1', 'w-2'),
    ).rejects.toBeInstanceOf(EncryptionUnlockError);
  });
});
