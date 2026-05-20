import { createContext } from 'react';

export type AuthEmailContextValue = {
  email: string;
  setEmail(email: string): void;
};

export const AuthEmailContext = createContext<AuthEmailContextValue | null>(
  null,
);
