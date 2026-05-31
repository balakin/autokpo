import {
  AUTH_SESSION_CACHE_NAME,
  E2EE_KEY_RING_CACHE_NAME,
} from './sw-cache-names';

export async function clearProtectedCaches(): Promise<void> {
  if (typeof caches === 'undefined') return;
  await Promise.all([
    caches.delete(AUTH_SESSION_CACHE_NAME),
    caches.delete(E2EE_KEY_RING_CACHE_NAME),
  ]);
}
