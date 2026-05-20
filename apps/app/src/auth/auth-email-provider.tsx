import { useState, type ReactNode } from 'react';

import { AuthEmailContext } from './auth-email-context';

export function AuthEmailProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState('');

  return (
    <AuthEmailContext value={{ email, setEmail }}>{children}</AuthEmailContext>
  );
}
