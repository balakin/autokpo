import type { ReactNode } from 'react';
import { Navigate } from 'react-router';

import { useAuth } from './use-auth';

type SignedInGateProps = {
  children: ReactNode;
};

export function SignedInGate({ children }: SignedInGateProps) {
  const auth = useAuth();

  if (auth.user === null) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
}
