import { useEffect, useState, type ReactNode } from 'react';

import { ThemeContext, type Theme } from './theme-context';
import { STORAGE_KEY, readStored, applyToDOM } from './theme-storage';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStored);

  function handleThemeChange(preference: Theme) {
    localStorage.setItem(STORAGE_KEY, preference);
    setTheme(preference);
    applyToDOM(preference);
  }

  useEffect(() => {
    if (theme !== 'system') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyToDOM('system');
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, [theme]);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || e.newValue === null) return;
      const newTheme = e.newValue;
      if (
        newTheme === 'light' ||
        newTheme === 'dark' ||
        newTheme === 'system'
      ) {
        setTheme(newTheme);
        applyToDOM(newTheme);
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <ThemeContext value={{ theme, setTheme: handleThemeChange }}>
      {children}
    </ThemeContext>
  );
}
