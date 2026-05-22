const AES_GCM = 'AES-GCM';

export function aesGcmEncrypt({
  keyBytes,
  iv,
  plaintext,
  aad,
}: {
  keyBytes: Uint8Array;
  iv: Uint8Array;
  plaintext: Uint8Array;
  aad: Uint8Array;
}): Promise<Uint8Array> {
  return withAesKey(keyBytes, async (key) => {
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: AES_GCM,
        iv: toArrayBuffer(iv),
        additionalData: toArrayBuffer(aad),
        tagLength: 128,
      },
      key,
      toArrayBuffer(plaintext),
    );
    return new Uint8Array(ciphertext);
  });
}

export function aesGcmDecrypt({
  keyBytes,
  iv,
  ciphertext,
  aad,
}: {
  keyBytes: Uint8Array;
  iv: Uint8Array;
  ciphertext: Uint8Array;
  aad: Uint8Array;
}): Promise<Uint8Array> {
  return withAesKey(keyBytes, async (key) => {
    const plaintext = await crypto.subtle.decrypt(
      {
        name: AES_GCM,
        iv: toArrayBuffer(iv),
        additionalData: toArrayBuffer(aad),
        tagLength: 128,
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
