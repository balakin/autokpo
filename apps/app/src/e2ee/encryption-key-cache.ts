import {
  isSerializedEncryptionKeyRecord,
  type SerializedEncryptionKeyRecord,
} from './encryption-key-record';

const KEY_CACHE_PREFIX = 'autokpo:e2ee:wrapped-key:';

function cacheKey(userId: string): string {
  return `${KEY_CACHE_PREFIX}${userId}`;
}

export function readCachedEncryptionKeyRecord(
  userId: string,
): SerializedEncryptionKeyRecord | null {
  const raw = localStorage.getItem(cacheKey(userId));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isSerializedEncryptionKeyRecord(parsed, userId)) return parsed;
  } catch {
    // Ignore and clear below.
  }
  localStorage.removeItem(cacheKey(userId));
  return null;
}

export function writeCachedEncryptionKeyRecord(
  userId: string,
  record: SerializedEncryptionKeyRecord,
): void {
  if (record.key.userId !== userId || record.wrapping.userId !== userId) {
    throw new Error('Encryption key record user mismatch');
  }
  localStorage.setItem(cacheKey(userId), JSON.stringify(record));
}
