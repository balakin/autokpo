import { use } from 'react';

import { AuthEmailContext } from './auth-email-context';

export function useAuthEmail() {
  const context = use(AuthEmailContext);
  if (context === null) {
    throw new Error('useAuthEmail must be used within AuthEmailProvider.');
  }
  return context;
}
