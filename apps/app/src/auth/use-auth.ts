import { useQueryClient } from '@tanstack/react-query';

import { logoutSession } from './auth-session';
import {
  SESSION_QUERY_KEY,
  sessionQueryOptions,
  useSessionQuery,
} from './use-session-query';

export function useAuth() {
  const queryClient = useQueryClient();
  const { data } = useSessionQuery();

  const user = data ?? null;

  async function logout() {
    await logoutSession();
    queryClient.setQueryData(SESSION_QUERY_KEY, null);
  }

  async function refresh(): Promise<string | null> {
    const result = await queryClient.fetchQuery({
      ...sessionQueryOptions,
      staleTime: 0,
    });
    return result?.id ?? null;
  }

  return { user, logout, refresh };
}
