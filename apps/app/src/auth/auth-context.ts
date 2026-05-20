import { createContext } from 'react';

export type AuthUser = {
  id: string;
  email: string | null;
  image: string | null;
  imageStatus?: 'importing' | 'ready';
};

export type AuthContextValue = {
  user: AuthUser | null;
  refresh(): Promise<string | null>;
  logout(): Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
