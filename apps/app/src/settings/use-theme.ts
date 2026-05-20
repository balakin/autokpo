import { use } from 'react';

import { ThemeContext } from './theme-context';

export function useTheme() {
  return use(ThemeContext);
}
