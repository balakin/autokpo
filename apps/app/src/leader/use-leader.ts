import { use } from 'react';

import { LeaderContext } from './leader-context';

export function useLeader() {
  const context = use(LeaderContext);
  if (context === null) {
    throw new Error('useLeader must be used within LeaderProvider');
  }
  return context;
}
