import { queryOptions, useQuery } from '@tanstack/react-query';

import { clearLocalEncryptionUnlockMaterial } from '../e2ee/cleanup';

import { authClient } from './auth-client';
import { readStoredSession, writeStoredSession } from './auth-session';

export const SESSION_QUERY_KEY = ['session'] as const;

export type SessionData = {
  id: string;
  email: string | null;
  sessionId: string | null;
};

export const sessionQueryOptions = queryOptions({
  queryKey: SESSION_QUERY_KEY,
  queryFn: fetchSession,
});

export function useSessionQuery() {
  return useQuery({
    ...sessionQueryOptions,
    networkMode: 'offlineFirst',
    initialData: (): SessionData | null => {
      const stored = readStoredSession();
      if (!stored) return null;
      return {
        id: stored.userId,
        email: stored.email,
        sessionId: stored.sessionId,
      };
    },
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

async function fetchSession(): Promise<SessionData | null> {
  const previousSession = readStoredSession();
  const result = await authClient.getSession();
  const user = result.data?.user;

  if (!user?.id) {
    if (previousSession?.userId) {
      clearLocalEncryptionUnlockMaterial(previousSession.userId);
    }
    writeStoredSession(null);
    return null;
  }

  if (previousSession?.userId && previousSession.userId !== user.id) {
    clearLocalEncryptionUnlockMaterial(previousSession.userId);
  }

  const sessionId = result.data?.session?.id ?? null;

  writeStoredSession({ userId: user.id, email: user.email ?? null, sessionId });

  return {
    id: user.id,
    email: user.email ?? null,
    sessionId,
  };
}
