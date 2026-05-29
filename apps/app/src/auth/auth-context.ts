import { createContext } from 'react';

export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthContextValue = {
  user: AuthUser | null;
  refresh(): Promise<string | null>;
  logout(): Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
