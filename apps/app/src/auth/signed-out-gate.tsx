import type { ReactNode } from 'react';
import { Navigate } from 'react-router';

import { useAuth } from './use-auth';

type SignedOutGateProps = {
  children: ReactNode;
};

export function SignedOutGate({ children }: SignedOutGateProps) {
  const auth = useAuth();

  if (auth.user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
