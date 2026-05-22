import { aesGcmDecrypt, aesGcmEncrypt } from './aes-gcm';
import { base64ToBytes, bytesToBase64 } from './base64';
import {
  KDF_PARAMS_V1,
  WRAP_PARAMS_V1,
  type CreateEncryptionKeyRequest,
  type SerializedEncryptionKeyRecord,
} from './encryption-key-record';
import { deriveKek } from './kdf';

const MASTER_KEY_BYTES = 32;
const KDF_SALT_BYTES = 16;

export class EncryptionUnlockError extends Error {
  constructor() {
    super('Failed to unwrap master key');
    this.name = 'EncryptionUnlockError';
  }
}

export async function createWrappedMasterKey(
  userId: string,
  password: string,
): Promise<{ request: CreateEncryptionKeyRequest; masterKey: Uint8Array }> {
  const keyId = crypto.randomUUID();
  const wrappingId = crypto.randomUUID();
  const masterKey = randomBytes(MASTER_KEY_BYTES);
  const salt = randomBytes(KDF_SALT_BYTES);
  const wrapIv = randomBytes(WRAP_PARAMS_V1.ivBytes);
  const kek = await deriveKek(password, salt, KDF_PARAMS_V1);
  const wrappedMasterKey = await aesGcmEncrypt({
    keyBytes: kek,
    iv: wrapIv,
    plaintext: masterKey,
    aad: masterKeyAad(userId, keyId, wrappingId),
  });

  return {
    masterKey,
    request: {
      keyId,
      wrappingId,
      kdfVersion: 1,
      kdfAlgorithm: 'argon2id',
      kdfParams: KDF_PARAMS_V1,
      kdfSalt: bytesToBase64(salt),
      wrapVersion: 1,
      wrapAlgorithm: 'aes-256-gcm',
      wrapParams: WRAP_PARAMS_V1,
      wrapIv: bytesToBase64(wrapIv),
      wrappedMasterKey: bytesToBase64(wrappedMasterKey),
    },
  };
}

export async function unwrapMasterKey(
  password: string,
  record: SerializedEncryptionKeyRecord,
): Promise<Uint8Array> {
  const salt = base64ToBytes(record.wrapping.kdfSalt);
  const wrapIv = base64ToBytes(record.wrapping.wrapIv);
  const wrappedMasterKey = base64ToBytes(record.wrapping.wrappedMasterKey);
  const kek = await deriveKek(password, salt, record.wrapping.kdfParams);
  try {
    const masterKey = await aesGcmDecrypt({
      keyBytes: kek,
      iv: wrapIv,
      ciphertext: wrappedMasterKey,
      aad: masterKeyAad(
        record.key.userId,
        record.key.keyId,
        record.wrapping.wrappingId,
      ),
    });
    if (masterKey.byteLength !== MASTER_KEY_BYTES) {
      throw new EncryptionUnlockError();
    }
    return masterKey;
  } catch {
    throw new EncryptionUnlockError();
  }
}

export function masterKeyAad(
  userId: string,
  keyId: string,
  wrappingId: string,
): Uint8Array {
  return new TextEncoder().encode(
    `autokpo:e2ee-master-key:wrap-v1:${userId}:${keyId}:${wrappingId}`,
  );
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}
