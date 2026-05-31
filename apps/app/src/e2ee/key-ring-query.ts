import { queryOptions, type QueryClient } from '@tanstack/react-query';

import { E2EE_KEY_RING_CACHE_NAME } from '../pwa/sw-cache-names';

import { fetchKeyRingProfile } from './key-ring-api';
import type { SerializedKeyRingProfile } from './key-ring-record';

export function keyRingProfileQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ['key-ring-profile', userId] as const,
    queryFn: () => fetchKeyRingProfile(),
    staleTime: 5 * 60 * 1000,
    retry: false,
    networkMode: 'offlineFirst',
  });
}

export async function cacheKeyRingProfile(
  queryClient: QueryClient,
  userId: string,
  profile: SerializedKeyRingProfile,
): Promise<void> {
  queryClient.setQueryData(
    keyRingProfileQueryOptions(userId).queryKey,
    profile,
  );
  try {
    await putKeyRingProfileInProtectedCache(profile);
  } catch {
    // React Query remains the source of truth for the active tab; CacheStorage
    // only keeps the Workbox NetworkFirst fallback warm for offline use.
  }
}

async function putKeyRingProfileInProtectedCache(
  profile: SerializedKeyRingProfile,
): Promise<void> {
  if (typeof caches === 'undefined') return;

  const cache = await caches.open(E2EE_KEY_RING_CACHE_NAME);
  const requestUrl = new URL(
    '/api/e2ee/key-ring',
    globalThis.location?.origin ?? 'http://localhost',
  );
  await cache.put(
    new Request(requestUrl),
    new Response(JSON.stringify(profile), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}
