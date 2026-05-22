import { describe, expect, it } from 'vitest';

import { base64ToBytes, bytesToBase64 } from '../base64';

describe('base64 helpers', () => {
  it('encodes and decodes empty byte arrays', () => {
    const bytes = new Uint8Array();

    expect(bytesToBase64(bytes)).toBe('');
    expect(base64ToBytes('')).toEqual(bytes);
  });

  it('round-trips arbitrary byte values', () => {
    const bytes = new Uint8Array([0, 1, 2, 127, 128, 254, 255]);

    const encoded = bytesToBase64(bytes);

    expect(encoded).toBe('AAECf4D+/w==');
    expect(base64ToBytes(encoded)).toEqual(bytes);
  });
});
