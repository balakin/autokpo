import { Navigate } from 'react-router';

import { useAuth } from './use-auth';

export function AuthStateRedirect() {
  const auth = useAuth();

  if (auth.isPending) return null;

  return <Navigate to={auth.user ? '/dashboard' : '/sign-in'} replace />;
}
