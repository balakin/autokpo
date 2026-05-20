import { createContext } from 'react';

export type LeaderContextValue = {
  isLeader: boolean;
};

export const LeaderContext = createContext<LeaderContextValue | null>(null);
