import {
  queryOptions,
  useQuery,
  type QueryClient,
  type QueryFunctionContext,
} from '@tanstack/react-query';

import { SESSION_LIFETIME_MS } from '../constants';

import { authClient } from './auth-client';

export const SESSION_QUERY_KEY = ['session'] as const;

export type SessionData = {
  id: string;
  email: string | null;
  sessionId: string | null;
};

export const sessionQueryOptions = queryOptions({
  queryKey: SESSION_QUERY_KEY,
  queryFn: fetchSession,
  staleTime: 5 * 60 * 1000,
  gcTime: SESSION_LIFETIME_MS,
  retry: false,
});

export function useSessionQuery() {
  return useQuery(sessionQueryOptions);
}

export function clearQueryCacheOnSignOut(queryClient: QueryClient): void {
  queryClient.setQueryData(SESSION_QUERY_KEY, null);
  queryClient.removeQueries({
    predicate: (q) => q.queryKey[0] !== SESSION_QUERY_KEY[0],
  });
}

async function fetchSession({
  signal,
}: QueryFunctionContext<
  typeof SESSION_QUERY_KEY
>): Promise<SessionData | null> {
  const result = await authClient.getSession({ fetchOptions: { signal } });
  const user = result.data?.user;

  if (!user?.id) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    sessionId: result.data?.session?.id ?? null,
  };
}
