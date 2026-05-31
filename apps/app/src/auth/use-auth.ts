import { useQueryClient } from '@tanstack/react-query';

import { logoutSession } from './auth-session';
import { broadcastSessionChange } from './session-broadcast';
import { cleanupSignedOutSession } from './session-cleanup';
import {
  clearQueryCacheOnSignOut,
  sessionQueryOptions,
  useSessionQuery,
} from './use-session-query';

export function useAuth() {
  const queryClient = useQueryClient();
  const { data, isPending } = useSessionQuery();

  const user = data ?? null;

  async function logout() {
    const currentUserId = data?.id ?? null;
    await logoutSession();
    await cleanupSignedOutSession(currentUserId);
    clearQueryCacheOnSignOut(queryClient);
  }

  async function refresh(): Promise<string | null> {
    const result = await queryClient.fetchQuery({
      ...sessionQueryOptions,
      staleTime: 0,
    });
    broadcastSessionChange(result ?? null);
    return result?.id ?? null;
  }

  return { user, isPending, logout, refresh };
}
