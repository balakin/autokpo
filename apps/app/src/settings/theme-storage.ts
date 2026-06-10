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

let tintStrips: HTMLDivElement[] = [];
let tintStripTimer: ReturnType<typeof setTimeout> | undefined;

export function applyToDOM(preference: Theme) {
  const resolved = resolveTheme(preference);
  const element = document.documentElement;
  element.classList.remove('light', 'dark');
  element.classList.add(resolved);
  element.setAttribute('data-theme', resolved);
  element.style.colorScheme = resolved;
  const existingTc = document.querySelector('meta[name="theme-color"]');
  existingTc?.remove();
  const tc = document.createElement('meta');
  tc.name = 'theme-color';
  tc.content = resolved === 'dark' ? '#080d16' : '#f3f5f6';
  document.head.appendChild(tc);
  // iOS 26 Safari ignores background changes after first paint, but
  // re-derives its bar tints when a fixed element appears at a viewport
  // edge — flash one per edge with the new background to force it. The
  // bottom one also overrides open drawers/modals, which Safari otherwise
  // keeps sampling for the bottom bar.
  for (const oldStrip of tintStrips) oldStrip.remove();
  clearTimeout(tintStripTimer);
  const background = getComputedStyle(document.body).backgroundColor;
  tintStrips = (['top', 'bottom'] as const).map((edge) => {
    const strip = document.createElement('div');
    strip.style.cssText =
      `position:fixed;${edge}:0;left:0;width:100%;height:6px;` +
      'z-index:9999;pointer-events:none;background:' +
      background;
    document.body.appendChild(strip);
    return strip;
  });
  tintStripTimer = setTimeout(() => {
    for (const strip of tintStrips) strip.remove();
  }, 500);
}
