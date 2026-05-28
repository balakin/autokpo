import { describe, expect, it } from 'vitest';

import { aesGcmDecrypt, aesGcmEncrypt } from '../aes-gcm';

const TAG_BITS = 128;

describe('aes-gcm helpers', () => {
  it('encrypts and decrypts bytes with matching key, iv, and aad', async () => {
    const keyBytes = new Uint8Array(32).fill(1);
    const iv = new Uint8Array(12).fill(2);
    const aad = new TextEncoder().encode('autokpo:test:aad');
    const plaintext = new TextEncoder().encode('secret payload');

    const ciphertext = await aesGcmEncrypt({
      keyBytes,
      params: { iv, tagBits: TAG_BITS },
      aad,
      plaintext,
    });
    const decrypted = await aesGcmDecrypt({
      keyBytes,
      params: { iv, tagBits: TAG_BITS },
      aad,
      ciphertext,
    });

    expect(ciphertext).not.toEqual(plaintext);
    expect(new TextDecoder().decode(decrypted)).toBe('secret payload');
  });

  it('rejects decrypt when aad changes', async () => {
    const keyBytes = new Uint8Array(32).fill(1);
    const iv = new Uint8Array(12).fill(2);
    const plaintext = new TextEncoder().encode('secret payload');
    const ciphertext = await aesGcmEncrypt({
      keyBytes,
      params: { iv, tagBits: TAG_BITS },
      plaintext,
      aad: new TextEncoder().encode('aad:one'),
    });

    await expect(
      aesGcmDecrypt({
        keyBytes,
        params: { iv, tagBits: TAG_BITS },
        ciphertext,
        aad: new TextEncoder().encode('aad:two'),
      }),
    ).rejects.toThrow();
  });
});
