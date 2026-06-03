import { queryOptions, type QueryClient } from '@tanstack/react-query';

import { SESSION_LIFETIME_MS } from '../constants';

import { fetchKeyRingProfile } from './key-ring-api';
import type { SerializedKeyRingProfile } from './key-ring-record';

export const KEY_RING_PROFILE_QUERY_KEY = 'key-ring-profile' as const;

export function keyRingProfileQueryOptions(userId: string) {
  return queryOptions({
    queryKey: [KEY_RING_PROFILE_QUERY_KEY, userId] as const,
    queryFn: () => fetchKeyRingProfile(),
    staleTime: 5 * 60 * 1000,
    gcTime: SESSION_LIFETIME_MS,
    retry: false,
  });
}

export function cacheKeyRingProfile(
  queryClient: QueryClient,
  userId: string,
  profile: SerializedKeyRingProfile,
): void {
  queryClient.setQueryData(
    keyRingProfileQueryOptions(userId).queryKey,
    profile,
  );
}
