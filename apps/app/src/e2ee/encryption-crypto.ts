import { aesGcmDecrypt, aesGcmEncrypt } from './aes-gcm';
import { base64ToBytes, bytesToBase64 } from './base64';
import { deriveKek } from './kdf';
import {
  KDF_PARAMS_V1,
  WRAPPING_PARAMS_V1,
  type CreateKeyRingProfileRequest,
  type KdfParamsV1,
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
  mek: Uint8Array;
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
    mek,
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
): Promise<{ mek: Uint8Array; activeDek: Uint8Array; activeDekId: string }> {
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
    const { activeDek, activeDekId } = await decryptKeyRingWithMek(
      mek,
      record.keyRing,
    );
    return { mek, activeDek, activeDekId };
  } catch {
    throw new EncryptionUnlockError();
  }
}

export async function decryptKeyRingWithMek(
  mek: Uint8Array,
  keyRing: {
    userId: string;
    activeDekId: string;
    iv: string;
    ciphertext: string;
  },
): Promise<{ activeDek: Uint8Array; activeDekId: string }> {
  const keyRingBytes = await aesGcmDecrypt({
    keyBytes: mek,
    iv: base64ToBytes(keyRing.iv),
    ciphertext: base64ToBytes(keyRing.ciphertext),
    aad: keyRingAad(keyRing.userId, keyRing.activeDekId),
  });
  const parsed = JSON.parse(new TextDecoder().decode(keyRingBytes)) as {
    activeDekId?: unknown;
    deks?: Record<string, unknown>;
  };
  const activeDekId = parsed.activeDekId;
  const deks = parsed.deks;
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
}

export function generateLdk(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function wrapMekWithLdk(
  mek: Uint8Array,
  ldk: CryptoKey,
  userId: string,
  wrapperId: string,
): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
  const iv = randomBytes(12);
  const aad = wrappedMekAad(userId, wrapperId, 'ldk');
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toBuffer(iv),
      additionalData: toBuffer(aad),
      tagLength: 128,
    },
    ldk,
    toBuffer(mek),
  );
  return { ciphertext: new Uint8Array(ciphertext), iv };
}

export async function unwrapMekWithLdk(
  ciphertext: Uint8Array,
  iv: Uint8Array,
  ldk: CryptoKey,
  userId: string,
  wrapperId: string,
): Promise<Uint8Array> {
  const aad = wrappedMekAad(userId, wrapperId, 'ldk');
  try {
    const mek = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: toBuffer(iv),
        additionalData: toBuffer(aad),
        tagLength: 128,
      },
      ldk,
      toBuffer(ciphertext),
    );
    return new Uint8Array(mek);
  } catch {
    throw new EncryptionUnlockError();
  }
}

function toBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
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

export function pinSaltAad(userId: string, wrapperId: string): Uint8Array {
  return new TextEncoder().encode(
    `autokpo:e2ee-pin-salt:v1:${userId}:${wrapperId}`,
  );
}

const PIN_SALT_BYTES = 16;

export async function wrapMekWithPin(
  mek: Uint8Array,
  pin: string,
  userId: string,
  wrapperId: string,
): Promise<{
  pinLdk: CryptoKey;
  pinSaltCiphertext: Uint8Array;
  pinSaltIv: Uint8Array;
  kdfParams: KdfParamsV1;
  ciphertext: Uint8Array;
  wrappingIv: Uint8Array;
}> {
  const pinLdk = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  const salt = randomBytes(PIN_SALT_BYTES);
  const pinSaltIv = randomBytes(WRAPPING_PARAMS_V1.ivBytes);
  const pinSaltCiphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toBuffer(pinSaltIv),
      additionalData: toBuffer(pinSaltAad(userId, wrapperId)),
      tagLength: WRAPPING_PARAMS_V1.tagBits,
    },
    pinLdk,
    toBuffer(salt),
  );
  const kek = await deriveKek(pin, salt, KDF_PARAMS_V1);
  const wrappingIv = randomBytes(WRAPPING_PARAMS_V1.ivBytes);
  const ciphertext = await aesGcmEncrypt({
    keyBytes: kek,
    iv: wrappingIv,
    plaintext: mek,
    aad: wrappedMekAad(userId, wrapperId, 'pin'),
  });
  return {
    pinLdk,
    pinSaltCiphertext: new Uint8Array(pinSaltCiphertextBuffer),
    pinSaltIv,
    kdfParams: KDF_PARAMS_V1,
    ciphertext,
    wrappingIv,
  };
}

export async function unwrapMekWithPin(
  record: {
    pinLdk: CryptoKey;
    pinSaltCiphertext: Uint8Array;
    pinSaltIv: Uint8Array;
    kdfParams: KdfParamsV1;
    ciphertext: Uint8Array;
    wrappingIv: Uint8Array;
    userId: string;
    wrapperId: string;
  },
  pin: string,
): Promise<Uint8Array> {
  try {
    const saltBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: toBuffer(record.pinSaltIv),
        additionalData: toBuffer(pinSaltAad(record.userId, record.wrapperId)),
        tagLength: WRAPPING_PARAMS_V1.tagBits,
      },
      record.pinLdk,
      toBuffer(record.pinSaltCiphertext),
    );
    const salt = new Uint8Array(saltBuffer);
    const kek = await deriveKek(pin, salt, record.kdfParams);
    const mek = await aesGcmDecrypt({
      keyBytes: kek,
      iv: record.wrappingIv,
      ciphertext: record.ciphertext,
      aad: wrappedMekAad(record.userId, record.wrapperId, 'pin'),
    });
    return mek;
  } catch {
    throw new EncryptionUnlockError();
  }
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}
