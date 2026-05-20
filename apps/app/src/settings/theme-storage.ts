import type { Theme } from './theme-context';

export const STORAGE_KEY = 'autokpo:theme';

export function readStored(): Theme {
  const theme = localStorage.getItem(STORAGE_KEY);
  return theme === 'light' || theme === 'dark' || theme === 'system'
    ? theme
    : 'system';
}

export function resolveTheme(preference: Theme): 'light' | 'dark' {
  if (preference === 'light' || preference === 'dark') return preference;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function applyToDOM(preference: Theme) {
  const resolved = resolveTheme(preference);
  const element = document.documentElement;
  element.classList.remove('light', 'dark');
  element.classList.add(resolved);
  element.setAttribute('data-theme', resolved);
  element.style.colorScheme = resolved;
}
