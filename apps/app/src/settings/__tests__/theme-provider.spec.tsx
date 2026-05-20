import { screen, render, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '../theme-provider';
import { STORAGE_KEY } from '../theme-storage';
import { useTheme } from '../use-theme';

const html = document.documentElement;

function ThemeDisplay() {
  const { theme } = useTheme();
  return <span data-testid="theme">{theme}</span>;
}

function ThemeButton({ next }: { next: string }) {
  const { setTheme } = useTheme();
  return (
    <button onClick={() => setTheme(next as 'light' | 'dark' | 'system')}>
      set
    </button>
  );
}

function renderProvider() {
  return render(
    <ThemeProvider>
      <ThemeDisplay />
      <ThemeButton next="light" />
    </ThemeProvider>,
  );
}

type ChangeListener = (e: MediaQueryListEvent) => void;

function stubMatchMedia(matches: boolean) {
  const listeners: ChangeListener[] = [];
  const stub = {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn((_: string, fn: ChangeListener) =>
      listeners.push(fn),
    ),
    removeEventListener: vi.fn((_: string, fn: ChangeListener) => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    }),
    dispatchEvent: () => false,
    fireChange: () => listeners.forEach((fn) => fn({} as MediaQueryListEvent)),
  };
  window.matchMedia = vi.fn(() => stub as unknown as MediaQueryList);
  return stub;
}

beforeEach(() => {
  localStorage.clear();
  html.classList.remove('light', 'dark');
  html.removeAttribute('data-theme');
  html.style.colorScheme = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ThemeProvider — mount', () => {
  it('reads stored theme preference on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    renderProvider();
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });
});

describe('ThemeProvider — setTheme', () => {
  it('persists preference to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeButton next="dark" />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button'));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });

  it('updates DOM when setTheme is called', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeButton next="dark" />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button'));
    expect(html.classList.contains('dark')).toBe(true);
    expect(html.getAttribute('data-theme')).toBe('dark');
    expect(html.style.colorScheme).toBe('dark');
  });

  it('removes old theme class when switching', async () => {
    html.classList.add('light');
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeButton next="dark" />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button'));
    expect(html.classList.contains('light')).toBe(false);
    expect(html.classList.contains('dark')).toBe(true);
  });
});

describe('ThemeProvider — storage event cross-tab sync', () => {
  it('updates theme when storage event fires for autokpo:theme', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    renderProvider();
    expect(screen.getByTestId('theme').textContent).toBe('dark');

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: 'light' }),
      );
    });

    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('applies DOM changes when storage event fires', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    renderProvider();

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: 'light' }),
      );
    });

    expect(html.classList.contains('light')).toBe(true);
    expect(html.classList.contains('dark')).toBe(false);
    expect(html.getAttribute('data-theme')).toBe('light');
  });

  it('ignores storage events for unrelated keys', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    renderProvider();

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'autokpo:other',
          newValue: 'light',
        }),
      );
    });

    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('ignores storage events with null newValue', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    renderProvider();

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: null }),
      );
    });

    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });
});

describe('ThemeProvider — system matchMedia listener', () => {
  it('reacts to OS change event when preference is system', () => {
    const stub = stubMatchMedia(false);
    renderProvider();

    stub.matches = true;
    stub.fireChange();

    expect(html.classList.contains('dark')).toBe(true);
    expect(html.classList.contains('light')).toBe(false);
    expect(html.getAttribute('data-theme')).toBe('dark');
  });

  it('removes OS listener when preference changes away from system', async () => {
    const stub = stubMatchMedia(false);
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeButton next="light" />
      </ThemeProvider>,
    );
    expect(stub.addEventListener).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button'));
    expect(stub.removeEventListener).toHaveBeenCalledOnce();
  });

  it('does not attach OS listener when preference is not system', () => {
    const stub = stubMatchMedia(false);
    localStorage.setItem(STORAGE_KEY, 'dark');
    renderProvider();
    expect(stub.addEventListener).not.toHaveBeenCalled();
  });
});
