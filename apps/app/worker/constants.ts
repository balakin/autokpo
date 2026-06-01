const MAX_SYNC_PLAINTEXT_BYTES = 1 * 1024 * 1024;

export const MAX_SYNC_CIPHERTEXT_BYTES = MAX_SYNC_PLAINTEXT_BYTES + 16;
export const MAX_KEY_RING_CIPHERTEXT_BYTES = 64 * 1024;
export const KDF_SALT_BYTES = 16;
export const AES_GCM_IV_BYTES = 12;
export const WRAPPED_MEK_CIPHERTEXT_BYTES = 48;

export const MAX_E2EE_BODY_BYTES = 128 * 1024;
export const MAX_SYNC_BODY_BYTES = 2 * 1024 * 1024;
export const MAX_AUTH_BODY_BYTES = 16 * 1024;

export function maxBase64Length(byteLength: number): number {
  return Math.ceil(byteLength / 3) * 4;
}
