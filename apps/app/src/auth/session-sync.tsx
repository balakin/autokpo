import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { SESSION_KEY, readStoredSession } from './auth-session';
import { SESSION_QUERY_KEY, type SessionData } from './use-session-query';

export function SessionSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SESSION_KEY) {
        return;
      }
      const nextSession = readStoredSession();
      queryClient.setQueryData(
        SESSION_QUERY_KEY,
        nextSession
          ? ({
              id: nextSession.userId,
              email: nextSession.email,
              sessionId: nextSession.sessionId,
            } satisfies SessionData)
          : null,
      );
    };

    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, [queryClient]);

  return null;
}
