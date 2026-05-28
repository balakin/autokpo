const AES_GCM = 'AES-GCM';

export function aesGcmEncrypt({
  keyBytes,
  params,
  plaintext,
  aad,
}: {
  keyBytes: Uint8Array;
  params: { iv: Uint8Array; tagBits: number };
  plaintext: Uint8Array;
  aad: Uint8Array;
}): Promise<Uint8Array> {
  return withAesKey(keyBytes, async (key) => {
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: AES_GCM,
        iv: toArrayBuffer(params.iv),
        additionalData: toArrayBuffer(aad),
        tagLength: params.tagBits,
      },
      key,
      toArrayBuffer(plaintext),
    );
    return new Uint8Array(ciphertext);
  });
}

export function aesGcmDecrypt({
  keyBytes,
  params,
  ciphertext,
  aad,
}: {
  keyBytes: Uint8Array;
  params: { iv: Uint8Array; tagBits: number };
  ciphertext: Uint8Array;
  aad: Uint8Array;
}): Promise<Uint8Array> {
  return withAesKey(keyBytes, async (key) => {
    const plaintext = await crypto.subtle.decrypt(
      {
        name: AES_GCM,
        iv: toArrayBuffer(params.iv),
        additionalData: toArrayBuffer(aad),
        tagLength: params.tagBits,
      },
      key,
      toArrayBuffer(ciphertext),
    );
    return new Uint8Array(plaintext);
  });
}

async function withAesKey<T>(
  keyBytes: Uint8Array,
  operation: (key: CryptoKey) => Promise<T>,
): Promise<T> {
  const key = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(keyBytes),
    AES_GCM,
    false,
    ['encrypt', 'decrypt'],
  );
  return operation(key);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}
