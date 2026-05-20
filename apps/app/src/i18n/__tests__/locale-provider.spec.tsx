import { useLocale as useReactAriaLocale } from '@heroui/react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '../i18n';
import type { Locale } from '../i18n';
import { LocaleProvider } from '../locale-provider';
import { STORAGE_KEY } from '../locale-storage';
import { useLocale } from '../use-locale';

function LocaleDisplay() {
  const { locale } = useLocale();
  return <span data-testid="locale">{locale}</span>;
}

function LocaleButton({ next }: { next: Locale }) {
  const { setLocale } = useLocale();
  return <button onClick={() => setLocale(next)}>set</button>;
}

function ReactAriaLocaleDisplay() {
  const { locale } = useReactAriaLocale();
  return <span data-testid="react-aria-locale">{locale}</span>;
}

function renderProvider(buttonTarget: Locale = 'en') {
  render(
    <LocaleProvider>
      <LocaleDisplay />
      <ReactAriaLocaleDisplay />
      <LocaleButton next={buttonTarget} />
    </LocaleProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  i18n.activate('sr-Latn');
  localStorage.clear();
});

describe('LocaleProvider — mount', () => {
  it('activates the locale from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'ru');
    renderProvider();
    expect(screen.getByTestId('locale').textContent).toBe('ru');
  });

  it('provides React Aria locale from app locale on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'ru');
    renderProvider();
    expect(screen.getByTestId('react-aria-locale').textContent).toBe('ru');
  });
});

describe('LocaleProvider — setLocale', () => {
  it('persists locale to localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, 'sr-Latn');
    const user = userEvent.setup();
    renderProvider('en');
    await user.click(screen.getByRole('button'));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
  });

  it('updates context value', async () => {
    localStorage.setItem(STORAGE_KEY, 'sr-Latn');
    const user = userEvent.setup();
    renderProvider('ru');
    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('locale').textContent).toBe('ru');
  });

  it('activates i18n with the new locale', async () => {
    localStorage.setItem(STORAGE_KEY, 'sr-Latn');
    const spy = vi.spyOn(i18n, 'activate');
    const user = userEvent.setup();
    renderProvider('en');
    spy.mockClear();
    await user.click(screen.getByRole('button'));
    expect(spy).toHaveBeenLastCalledWith('en');
  });

  it('updates React Aria locale when locale changes', async () => {
    localStorage.setItem(STORAGE_KEY, 'sr-Latn');
    const user = userEvent.setup();
    renderProvider('en');
    expect(screen.getByTestId('react-aria-locale').textContent).toBe('sr-Latn');

    await user.click(screen.getByRole('button'));

    expect(screen.getByTestId('react-aria-locale').textContent).toBe('en');
  });
});

describe('LocaleProvider — storage event cross-tab sync', () => {
  it('updates locale when storage event fires for autokpo:locale', () => {
    localStorage.setItem(STORAGE_KEY, 'sr-Latn');
    renderProvider();
    expect(screen.getByTestId('locale').textContent).toBe('sr-Latn');

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: 'en' }),
      );
    });

    expect(screen.getByTestId('locale').textContent).toBe('en');
  });

  it('activates i18n when storage event fires', () => {
    localStorage.setItem(STORAGE_KEY, 'sr-Latn');
    const spy = vi.spyOn(i18n, 'activate');
    renderProvider();
    spy.mockClear();

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: 'ru' }),
      );
    });

    expect(spy).toHaveBeenLastCalledWith('ru');
  });

  it('ignores storage events for unrelated keys', () => {
    localStorage.setItem(STORAGE_KEY, 'sr-Latn');
    renderProvider();

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'autokpo:other', newValue: 'en' }),
      );
    });

    expect(screen.getByTestId('locale').textContent).toBe('sr-Latn');
  });

  it('ignores storage events with null newValue', () => {
    localStorage.setItem(STORAGE_KEY, 'sr-Latn');
    renderProvider();

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: null }),
      );
    });

    expect(screen.getByTestId('locale').textContent).toBe('sr-Latn');
  });

  it('ignores storage events with unsupported locale', () => {
    localStorage.setItem(STORAGE_KEY, 'sr-Latn');
    renderProvider();

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: 'fr' }),
      );
    });

    expect(screen.getByTestId('locale').textContent).toBe('sr-Latn');
  });
});
