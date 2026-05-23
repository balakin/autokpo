import { aesGcmDecrypt, aesGcmEncrypt } from './aes-gcm';
import { base64ToBytes, bytesToBase64 } from './base64';
import { deriveKek } from './kdf';
import {
  KDF_PARAMS_V1,
  WRAPPING_PARAMS_V1,
  type CreateKeyRingProfileRequest,
  type SerializedKeyRingProfile,
} from './key-ring-record';

const MEK_BYTES = 32;
const DEK_BYTES = 32;
const KDF_SALT_BYTES = 16;

export class EncryptionUnlockError extends Error {
  constructor() {
    super('Failed to unlock key ring');
    this.name = 'EncryptionUnlockError';
  }
}

export async function createKeyRingProfilePayload(
  userId: string,
  password: string,
): Promise<{
  request: CreateKeyRingProfileRequest;
  activeDek: Uint8Array;
  activeDekId: string;
}> {
  const keyRingId = crypto.randomUUID();
  const wrappingId = crypto.randomUUID();
  const activeDekId = crypto.randomUUID();
  const mek = randomBytes(MEK_BYTES);
  const dek = randomBytes(DEK_BYTES);
  const salt = randomBytes(KDF_SALT_BYTES);
  const keyRingIv = randomBytes(WRAPPING_PARAMS_V1.ivBytes);
  const wrappingIv = randomBytes(WRAPPING_PARAMS_V1.ivBytes);
  const kek = await deriveKek(password, salt, KDF_PARAMS_V1);
  const keyRingPlaintext = JSON.stringify({
    version: 1,
    activeDekId,
    deks: {
      [activeDekId]: bytesToBase64(dek),
    },
  });
  const keyRingCiphertext = await aesGcmEncrypt({
    keyBytes: mek,
    iv: keyRingIv,
    plaintext: new TextEncoder().encode(keyRingPlaintext),
    aad: keyRingAad(userId, activeDekId),
  });
  const wrappedMek = await aesGcmEncrypt({
    keyBytes: kek,
    iv: wrappingIv,
    plaintext: mek,
    aad: wrappedMekAad(userId, wrappingId, 'password'),
  });

  return {
    activeDek: dek,
    activeDekId,
    request: {
      keyRingId,
      wrappingId,
      activeDekId,
      kdfVersion: 1,
      kdfAlgorithm: 'argon2id',
      kdfParams: KDF_PARAMS_V1,
      kdfSalt: bytesToBase64(salt),
      encryptionVersion: 1,
      encryptionAlgorithm: 'aes-256-gcm',
      keyRingIv: bytesToBase64(keyRingIv),
      keyRingCiphertext: bytesToBase64(keyRingCiphertext),
      wrappingVersion: 1,
      wrappingAlgorithm: 'aes-256-gcm',
      wrappingParams: WRAPPING_PARAMS_V1,
      wrappingIv: bytesToBase64(wrappingIv),
      ciphertext: bytesToBase64(wrappedMek),
    },
  };
}

export async function unwrapKeyRingProfile(
  password: string,
  record: SerializedKeyRingProfile,
): Promise<{ activeDek: Uint8Array; activeDekId: string }> {
  const wrapper = record.wrappers.find((item) => item.method === 'password');
  if (!wrapper) throw new EncryptionUnlockError();
  const salt = base64ToBytes(wrapper.kdfSalt);
  const wrappingIv = base64ToBytes(wrapper.wrappingIv);
  const wrappedMek = base64ToBytes(wrapper.ciphertext);
  const kek = await deriveKek(password, salt, wrapper.kdfParams);
  try {
    const mek = await aesGcmDecrypt({
      keyBytes: kek,
      iv: wrappingIv,
      ciphertext: wrappedMek,
      aad: wrappedMekAad(record.keyRing.userId, wrapper.id, wrapper.method),
    });
    if (mek.byteLength !== MEK_BYTES) {
      throw new EncryptionUnlockError();
    }
    const keyRingBytes = await aesGcmDecrypt({
      keyBytes: mek,
      iv: base64ToBytes(record.keyRing.iv),
      ciphertext: base64ToBytes(record.keyRing.ciphertext),
      aad: keyRingAad(record.keyRing.userId, record.keyRing.activeDekId),
    });
    const keyRing = JSON.parse(new TextDecoder().decode(keyRingBytes)) as {
      activeDekId?: unknown;
      deks?: Record<string, unknown>;
    };
    const activeDekId = keyRing.activeDekId;
    const deks = keyRing.deks;
    const activeDekEncoded =
      typeof activeDekId === 'string' ? deks?.[activeDekId] : undefined;
    if (
      typeof activeDekId !== 'string' ||
      deks === undefined ||
      Object.keys(deks).length !== 1 ||
      !(activeDekId in deks) ||
      typeof activeDekEncoded !== 'string'
    ) {
      throw new EncryptionUnlockError();
    }
    const activeDek = base64ToBytes(activeDekEncoded);
    if (activeDek.byteLength !== DEK_BYTES) {
      throw new EncryptionUnlockError();
    }
    return { activeDek, activeDekId };
  } catch {
    throw new EncryptionUnlockError();
  }
}

export function keyRingAad(userId: string, activeDekId: string): Uint8Array {
  return new TextEncoder().encode(
    `autokpo:e2ee-key-ring:v1:${userId}:${activeDekId}`,
  );
}

export function wrappedMekAad(
  userId: string,
  wrapperId: string,
  method: string,
): Uint8Array {
  return new TextEncoder().encode(
    `autokpo:e2ee-wrapped-mek:v1:${userId}:${wrapperId}:${method}`,
  );
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}
