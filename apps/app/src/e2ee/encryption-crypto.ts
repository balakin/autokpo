import { aesGcmDecrypt, aesGcmEncrypt } from './aes-gcm';
import { base64ToBytes, bytesToBase64 } from './base64';
import { deriveKek } from './kdf';
import {
  AES_GCM_PARAMS_V1,
  KDF_PARAMS_V1,
  type ChangeMasterPasswordRequest,
  type CreateKeyRingProfileRequest,
  type KdfParamsV1,
  type SerializedKeyRingProfile,
  type UpdateKeyRingRequest,
} from './key-ring-record';

const MEK_BYTES = 32;
const DEK_BYTES = 32;
const KDF_SALT_BYTES = 16;
const IV_BYTES = 12;

export class EncryptionUnlockError extends Error {
  constructor() {
    super('Failed to unlock key ring');
    this.name = 'EncryptionUnlockError';
  }
}

export type DecryptedKeyRing = {
  activeDek: Uint8Array;
  activeDekId: string;
  revision: number;
  deks: Record<string, Uint8Array>;
};

export async function createKeyRingProfilePayload(
  userId: string,
  password: string,
): Promise<{
  request: CreateKeyRingProfileRequest;
  mek: Uint8Array;
  activeDek: Uint8Array;
  activeDekId: string;
  revision: number;
  deks: Record<string, Uint8Array>;
}> {
  const keyRingId = crypto.randomUUID();
  const wrappingId = crypto.randomUUID();
  const activeDekId = crypto.randomUUID();
  const mek = randomBytes(MEK_BYTES);
  const dek = randomBytes(DEK_BYTES);
  const salt = randomBytes(KDF_SALT_BYTES);
  const keyRingIv = randomBytes(IV_BYTES);
  const wrappingIv = randomBytes(IV_BYTES);
  const kek = await deriveKek(password, salt, KDF_PARAMS_V1);
  const keyRingPlaintext = JSON.stringify({
    version: 1,
    revision: 1,
    activeDekId,
    deks: {
      [activeDekId]: bytesToBase64(dek),
    },
  });
  const keyRingCiphertext = await aesGcmEncrypt({
    keyBytes: mek,
    params: { iv: keyRingIv, tagBits: AES_GCM_PARAMS_V1.tagBits },
    plaintext: new TextEncoder().encode(keyRingPlaintext),
    aad: keyRingAad(keyRingId, userId, activeDekId, 1),
  });
  const wrappedMek = await aesGcmEncrypt({
    keyBytes: kek,
    params: { iv: wrappingIv, tagBits: AES_GCM_PARAMS_V1.tagBits },
    plaintext: mek,
    aad: wrappedMekAad(userId, wrappingId, 'password'),
  });

  return {
    mek,
    activeDek: dek,
    activeDekId,
    revision: 1,
    deks: { [activeDekId]: dek },
    request: {
      keyRingId,
      wrappingId,
      activeDekId,
      keyRing: {
        encryptionAlgorithm: 'aes-256-gcm',
        encryptionParams: {
          iv: bytesToBase64(keyRingIv),
          tagBits: AES_GCM_PARAMS_V1.tagBits,
        },
        ciphertext: bytesToBase64(keyRingCiphertext),
      },
      mek: {
        kdfAlgorithm: 'argon2id',
        kdfParams: KDF_PARAMS_V1,
        kdfSalt: bytesToBase64(salt),
        wrappingAlgorithm: 'aes-256-gcm',
        wrappingParams: {
          iv: bytesToBase64(wrappingIv),
          tagBits: AES_GCM_PARAMS_V1.tagBits,
        },
        ciphertext: bytesToBase64(wrappedMek),
      },
    },
  };
}

export async function createPasswordWrapperPayload(
  userId: string,
  currentWrappingId: string,
  mek: Uint8Array,
  password: string,
): Promise<ChangeMasterPasswordRequest> {
  const wrappingId = crypto.randomUUID();
  const salt = randomBytes(KDF_SALT_BYTES);
  const wrappingIv = randomBytes(IV_BYTES);
  const kek = await deriveKek(password, salt, KDF_PARAMS_V1);
  const wrappedMek = await aesGcmEncrypt({
    keyBytes: kek,
    params: { iv: wrappingIv, tagBits: AES_GCM_PARAMS_V1.tagBits },
    plaintext: mek,
    aad: wrappedMekAad(userId, wrappingId, 'password'),
  });

  return {
    currentWrappingId,
    wrappingId,
    kdfAlgorithm: 'argon2id',
    kdfParams: KDF_PARAMS_V1,
    kdfSalt: bytesToBase64(salt),
    wrappingAlgorithm: 'aes-256-gcm',
    wrappingParams: {
      iv: bytesToBase64(wrappingIv),
      tagBits: AES_GCM_PARAMS_V1.tagBits,
    },
    ciphertext: bytesToBase64(wrappedMek),
  };
}

export async function unwrapKeyRingProfile(
  password: string,
  record: SerializedKeyRingProfile,
): Promise<{ mek: Uint8Array } & DecryptedKeyRing> {
  const wrapper = record.wrappers.find((item) => item.method === 'password');
  if (!wrapper) throw new EncryptionUnlockError();
  const salt = base64ToBytes(wrapper.kdfSalt);
  const wrappingIv = base64ToBytes(wrapper.wrappingParams.iv);
  const wrappedMek = base64ToBytes(wrapper.ciphertext);
  const kek = await deriveKek(password, salt, wrapper.kdfParams);
  try {
    const tagBits = wrapper.wrappingParams.tagBits;
    const mek = await aesGcmDecrypt({
      keyBytes: kek,
      params: { iv: wrappingIv, tagBits },
      ciphertext: wrappedMek,
      aad: wrappedMekAad(record.keyRing.userId, wrapper.id, wrapper.method),
    });
    if (mek.byteLength !== MEK_BYTES) {
      throw new EncryptionUnlockError();
    }
    const decrypted = await decryptKeyRingWithMek(mek, record.keyRing);
    return { mek, ...decrypted };
  } catch {
    throw new EncryptionUnlockError();
  }
}

export async function decryptKeyRingWithMek(
  mek: Uint8Array,
  keyRing: {
    id: string;
    userId: string;
    activeDekId: string;
    revision: number;
    encryptionParams: { iv: string | Uint8Array; tagBits: number };
    ciphertext: string;
  },
): Promise<DecryptedKeyRing> {
  const iv =
    typeof keyRing.encryptionParams.iv === 'string'
      ? base64ToBytes(keyRing.encryptionParams.iv)
      : keyRing.encryptionParams.iv;
  const keyRingBytes = await aesGcmDecrypt({
    keyBytes: mek,
    params: {
      iv,
      tagBits: keyRing.encryptionParams.tagBits,
    },
    ciphertext: base64ToBytes(keyRing.ciphertext),
    aad: keyRingAad(
      keyRing.id,
      keyRing.userId,
      keyRing.activeDekId,
      keyRing.revision,
    ),
  });
  const parsed = JSON.parse(new TextDecoder().decode(keyRingBytes)) as {
    revision?: unknown;
    activeDekId?: unknown;
    deks?: Record<string, unknown>;
  };
  const revision = parsed.revision;
  const activeDekId = parsed.activeDekId;
  const deks = parsed.deks;
  if (
    revision !== keyRing.revision ||
    activeDekId !== keyRing.activeDekId ||
    deks === undefined ||
    !(activeDekId in deks)
  ) {
    throw new EncryptionUnlockError();
  }

  const decodedDeks: Record<string, Uint8Array> = {};
  for (const [dekId, encoded] of Object.entries(deks)) {
    if (typeof encoded !== 'string') {
      throw new EncryptionUnlockError();
    }
    const decoded = base64ToBytes(encoded);
    if (decoded.byteLength !== DEK_BYTES) {
      throw new EncryptionUnlockError();
    }
    decodedDeks[dekId] = decoded;
  }

  const activeDek = decodedDeks[activeDekId];
  if (!activeDek) throw new EncryptionUnlockError();
  return {
    activeDek,
    activeDekId,
    revision: keyRing.revision,
    deks: decodedDeks,
  };
}

export async function createRotatedKeyRingPayload({
  keyRingId,
  userId,
  mek,
  currentRevision,
  deks,
}: {
  keyRingId: string;
  userId: string;
  mek: Uint8Array;
  currentRevision: number;
  deks: Record<string, Uint8Array>;
}): Promise<{ request: UpdateKeyRingRequest } & DecryptedKeyRing> {
  const activeDekId = crypto.randomUUID();
  const activeDek = randomBytes(DEK_BYTES);
  const revision = currentRevision + 1;
  const nextDeks = { ...deks, [activeDekId]: activeDek };
  const keyRingIv = randomBytes(IV_BYTES);
  const encodedDeks = Object.fromEntries(
    Object.entries(nextDeks).map(([dekId, dek]) => [dekId, bytesToBase64(dek)]),
  );
  const keyRingPlaintext = JSON.stringify({
    version: 1,
    revision,
    activeDekId,
    deks: encodedDeks,
  });
  const keyRingCiphertext = await aesGcmEncrypt({
    keyBytes: mek,
    params: { iv: keyRingIv, tagBits: AES_GCM_PARAMS_V1.tagBits },
    plaintext: new TextEncoder().encode(keyRingPlaintext),
    aad: keyRingAad(keyRingId, userId, activeDekId, revision),
  });

  return {
    activeDek,
    activeDekId,
    revision,
    deks: nextDeks,
    request: {
      currentRevision,
      activeDekId,
      encryptionAlgorithm: 'aes-256-gcm',
      encryptionParams: {
        iv: bytesToBase64(keyRingIv),
        tagBits: AES_GCM_PARAMS_V1.tagBits,
      },
      ciphertext: bytesToBase64(keyRingCiphertext),
    },
  };
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
): Promise<{
  ciphertext: Uint8Array;
  wrappingParams: { iv: Uint8Array; tagBits: number };
}> {
  const iv = randomBytes(IV_BYTES);
  const aad = wrappedMekAad(userId, wrapperId, 'ldk');
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toBuffer(iv),
      additionalData: toBuffer(aad),
      tagLength: AES_GCM_PARAMS_V1.tagBits,
    },
    ldk,
    toBuffer(mek),
  );
  return {
    ciphertext: new Uint8Array(ciphertext),
    wrappingParams: { iv, tagBits: AES_GCM_PARAMS_V1.tagBits },
  };
}

export async function unwrapMekWithLdk(
  ciphertext: Uint8Array,
  wrappingParams: { iv: Uint8Array; tagBits: number },
  ldk: CryptoKey,
  userId: string,
  wrapperId: string,
): Promise<Uint8Array> {
  const aad = wrappedMekAad(userId, wrapperId, 'ldk');
  try {
    const mek = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: toBuffer(wrappingParams.iv),
        additionalData: toBuffer(aad),
        tagLength: wrappingParams.tagBits,
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

export function keyRingAad(
  keyRingId: string,
  userId: string,
  activeDekId: string,
  revision: number,
): Uint8Array {
  return new TextEncoder().encode(
    `autokpo:e2ee-key-ring:v1:${keyRingId}:${userId}:${activeDekId}:${revision}`,
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
  pinSaltParams: { iv: Uint8Array; tagBits: number };
  kdfParams: KdfParamsV1;
  ciphertext: Uint8Array;
  wrappingParams: { iv: Uint8Array; tagBits: number };
}> {
  const pinLdk = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  const salt = randomBytes(PIN_SALT_BYTES);
  const pinSaltIv = randomBytes(IV_BYTES);
  const pinSaltCiphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toBuffer(pinSaltIv),
      additionalData: toBuffer(pinSaltAad(userId, wrapperId)),
      tagLength: AES_GCM_PARAMS_V1.tagBits,
    },
    pinLdk,
    toBuffer(salt),
  );
  const kek = await deriveKek(pin, salt, KDF_PARAMS_V1);
  const wrappingIv = randomBytes(IV_BYTES);
  const ciphertext = await aesGcmEncrypt({
    keyBytes: kek,
    params: { iv: wrappingIv, tagBits: AES_GCM_PARAMS_V1.tagBits },
    plaintext: mek,
    aad: wrappedMekAad(userId, wrapperId, 'pin'),
  });
  return {
    pinLdk,
    pinSaltCiphertext: new Uint8Array(pinSaltCiphertextBuffer),
    pinSaltParams: { iv: pinSaltIv, tagBits: AES_GCM_PARAMS_V1.tagBits },
    kdfParams: KDF_PARAMS_V1,
    ciphertext,
    wrappingParams: { iv: wrappingIv, tagBits: AES_GCM_PARAMS_V1.tagBits },
  };
}

export async function unwrapMekWithPin(
  record: {
    pinLdk: CryptoKey;
    pinSaltCiphertext: Uint8Array;
    pinSaltParams: { iv: Uint8Array; tagBits: number };
    kdfParams: KdfParamsV1;
    ciphertext: Uint8Array;
    wrappingParams: { iv: Uint8Array; tagBits: number };
    userId: string;
    wrapperId: string;
  },
  pin: string,
): Promise<Uint8Array> {
  try {
    const saltBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: toBuffer(record.pinSaltParams.iv),
        additionalData: toBuffer(pinSaltAad(record.userId, record.wrapperId)),
        tagLength: record.pinSaltParams.tagBits,
      },
      record.pinLdk,
      toBuffer(record.pinSaltCiphertext),
    );
    const salt = new Uint8Array(saltBuffer);
    const kek = await deriveKek(pin, salt, record.kdfParams);
    const mek = await aesGcmDecrypt({
      keyBytes: kek,
      params: {
        iv: record.wrappingParams.iv,
        tagBits: record.wrappingParams.tagBits,
      },
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
