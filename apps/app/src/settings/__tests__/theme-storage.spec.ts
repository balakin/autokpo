import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  STORAGE_KEY,
  applyToDOM,
  readStored,
  resolveTheme,
} from '../theme-storage';

const html = document.documentElement;

beforeEach(() => {
  localStorage.clear();
  html.classList.remove('light', 'dark');
  html.removeAttribute('data-theme');
  html.style.colorScheme = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('readStored', () => {
  it('defaults to system when localStorage is empty', () => {
    expect(readStored()).toBe('system');
  });

  it('returns light when stored', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    expect(readStored()).toBe('light');
  });

  it('returns dark when stored', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    expect(readStored()).toBe('dark');
  });

  it('returns system when stored', () => {
    localStorage.setItem(STORAGE_KEY, 'system');
    expect(readStored()).toBe('system');
  });

  it('falls back to system for an invalid stored value', () => {
    localStorage.setItem(STORAGE_KEY, 'purple');
    expect(readStored()).toBe('system');
  });
});

describe('resolveTheme', () => {
  it('returns light directly', () => {
    expect(resolveTheme('light')).toBe('light');
  });

  it('returns dark directly', () => {
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('resolves system to dark when OS prefers dark', () => {
    window.matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList);
    expect(resolveTheme('system')).toBe('dark');
  });

  it('resolves system to light when OS prefers light', () => {
    window.matchMedia = vi.fn(() => ({ matches: false }) as MediaQueryList);
    expect(resolveTheme('system')).toBe('light');
  });
});

describe('applyToDOM', () => {
  it('applies light class and attributes', () => {
    applyToDOM('light');
    expect(html.classList.contains('light')).toBe(true);
    expect(html.classList.contains('dark')).toBe(false);
    expect(html.getAttribute('data-theme')).toBe('light');
    expect(html.style.colorScheme).toBe('light');
  });

  it('applies dark class and attributes', () => {
    applyToDOM('dark');
    expect(html.classList.contains('dark')).toBe(true);
    expect(html.classList.contains('light')).toBe(false);
    expect(html.getAttribute('data-theme')).toBe('dark');
    expect(html.style.colorScheme).toBe('dark');
  });

  it('removes old class when switching', () => {
    html.classList.add('light');
    applyToDOM('dark');
    expect(html.classList.contains('light')).toBe(false);
    expect(html.classList.contains('dark')).toBe(true);
  });

  it('resolves system via matchMedia before applying', () => {
    window.matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList);
    applyToDOM('system');
    expect(html.classList.contains('dark')).toBe(true);
    expect(html.getAttribute('data-theme')).toBe('dark');
  });
});
