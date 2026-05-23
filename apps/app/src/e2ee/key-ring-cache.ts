import {
  isSerializedKeyRingProfile,
  type SerializedKeyRingProfile,
} from './key-ring-record';

const KEY_CACHE_PREFIX = 'autokpo:e2ee:key-ring:';

function cacheKey(userId: string): string {
  return `${KEY_CACHE_PREFIX}${userId}`;
}

export function readCachedKeyRingProfile(
  userId: string,
): SerializedKeyRingProfile | null {
  const raw = localStorage.getItem(cacheKey(userId));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isSerializedKeyRingProfile(parsed, userId)) return parsed;
  } catch {
    // Ignore and clear below.
  }
  localStorage.removeItem(cacheKey(userId));
  return null;
}

export function writeCachedKeyRingProfile(
  userId: string,
  record: SerializedKeyRingProfile,
): void {
  if (
    record.keyRing.userId !== userId ||
    record.wrappers.some((wrapper) => wrapper.userId !== userId)
  ) {
    throw new Error('Key ring profile user mismatch');
  }
  localStorage.setItem(cacheKey(userId), JSON.stringify(record));
}
