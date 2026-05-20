import { useEffect, useState, type ReactNode } from 'react';

import { AuthContext } from './auth-context';
import {
  SESSION_KEY,
  type StoredSession,
  logoutSession,
  readStoredSession,
  refreshSession,
} from './auth-session';

function authStateFromSession(session: StoredSession | null) {
  return {
    user:
      session?.userId === undefined
        ? null
        : {
            id: session.userId,
            email: session.email ?? null,
            image: session.image ?? null,
            imageStatus: session.imageStatus ?? 'ready',
          },
  };
}

function getInitialAuthState() {
  return authStateFromSession(readStoredSession());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState(getInitialAuthState);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SESSION_KEY) {
        return;
      }
      setAuthState(authStateFromSession(readStoredSession()));
    };

    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    void refreshSession().then((nextUserId) => {
      if (!nextUserId) {
        setAuthState({ user: null });
        return;
      }
      setAuthState(authStateFromSession(readStoredSession()));
    });
  }, []);

  useEffect(() => {
    if (authState.user?.imageStatus !== 'importing') return;

    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts += 1;
      void refreshSession().then(() => {
        setAuthState(authStateFromSession(readStoredSession()));
      });

      if (attempts >= 8) {
        window.clearInterval(interval);
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [authState.user?.imageStatus]);

  async function logout() {
    await logoutSession();
    setAuthState({ user: null });
  }

  async function refresh() {
    const nextUserId = await refreshSession();
    setAuthState(authStateFromSession(readStoredSession()));
    return nextUserId;
  }

  return (
    <AuthContext
      value={{
        user: authState.user,
        refresh,
        logout,
      }}
    >
      {children}
    </AuthContext>
  );
}
