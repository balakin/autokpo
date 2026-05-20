import { use } from 'react';

import { AuthContext } from './auth-context';

export function useAuth() {
  const auth = use(AuthContext);
  if (auth === null) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return auth;
}
