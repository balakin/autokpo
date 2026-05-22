import { describe, expect, it } from 'vitest';

import { aesGcmDecrypt, aesGcmEncrypt } from '../aes-gcm';

describe('aes-gcm helpers', () => {
  it('encrypts and decrypts bytes with matching key, iv, and aad', async () => {
    const keyBytes = new Uint8Array(32).fill(1);
    const iv = new Uint8Array(12).fill(2);
    const aad = new TextEncoder().encode('autokpo:test:aad');
    const plaintext = new TextEncoder().encode('secret payload');

    const ciphertext = await aesGcmEncrypt({ keyBytes, iv, aad, plaintext });
    const decrypted = await aesGcmDecrypt({
      keyBytes,
      iv,
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
      iv,
      plaintext,
      aad: new TextEncoder().encode('aad:one'),
    });

    await expect(
      aesGcmDecrypt({
        keyBytes,
        iv,
        ciphertext,
        aad: new TextEncoder().encode('aad:two'),
      }),
    ).rejects.toThrow();
  });
});
