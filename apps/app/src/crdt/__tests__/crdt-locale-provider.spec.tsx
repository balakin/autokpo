import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';

import { i18n } from '../../i18n/i18n';
import { LocaleProvider } from '../../i18n/locale-provider';
import { useLocale } from '../../i18n/use-locale';
import { CrdtLocaleProvider } from '../crdt-locale-provider';
import { DocContext } from '../doc-context';
import type { TypedDoc } from '../typed-doc';

const STORAGE_KEY = 'autokpo:locale';

function makeDoc(locale?: string): TypedDoc {
  const doc = new Y.Doc() as unknown as TypedDoc;
  if (locale !== undefined) {
    doc.transact(() => doc.getMap('user').set('locale', locale));
  }
  return doc;
}

function LocaleDisplay() {
  const { locale } = useLocale();
  return <span data-testid="locale">{locale}</span>;
}

function LocaleButton({ next }: { next: string }) {
  const { setLocale } = useLocale();
  return (
    <button onClick={() => setLocale(next as 'sr-Latn' | 'en' | 'ru')}>
      set
    </button>
  );
}

function renderWithDoc(doc: TypedDoc, buttonTarget: string = 'ru') {
  render(
    <DocContext value={doc}>
      <LocaleProvider>
        <CrdtLocaleProvider>
          <LocaleDisplay />
          <LocaleButton next={buttonTarget} />
        </CrdtLocaleProvider>
      </LocaleProvider>
    </DocContext>,
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

describe('LocaleSynchronizer — initial mount sync', () => {
  it('syncs CRDT locale to localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'sr-Latn');
    const doc = makeDoc('en');
    renderWithDoc(doc);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
  });

  it('updates displayed locale to match CRDT on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'sr-Latn');
    const doc = makeDoc('ru');
    renderWithDoc(doc);
    expect(screen.getByTestId('locale').textContent).toBe('ru');
  });

  it('activates i18n with CRDT locale on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'sr-Latn');
    const spy = vi.spyOn(i18n, 'activate');
    const doc = makeDoc('en');
    renderWithDoc(doc);
    expect(spy).toHaveBeenCalledWith('en');
  });
});

describe('LocaleSynchronizer — remote CRDT update propagation', () => {
  it('syncs remote CRDT locale change to localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'sr-Latn');
    const doc = makeDoc('sr-Latn');
    renderWithDoc(doc);

    act(() => {
      doc.transact(() => doc.getMap('user').set('locale', 'ru'));
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe('ru');
  });

  it('updates displayed locale on remote CRDT change', () => {
    localStorage.setItem(STORAGE_KEY, 'sr-Latn');
    const doc = makeDoc('sr-Latn');
    renderWithDoc(doc);

    act(() => {
      doc.transact(() => doc.getMap('user').set('locale', 'en'));
    });

    expect(screen.getByTestId('locale').textContent).toBe('en');
  });
});

describe('CrdtLocaleProvider — user-initiated locale change', () => {
  it('writes to CRDT doc when setLocale is called inside CrdtLocaleProvider', async () => {
    localStorage.setItem(STORAGE_KEY, 'sr-Latn');
    const doc = makeDoc('sr-Latn');
    const user = userEvent.setup();
    renderWithDoc(doc, 'en');

    await user.click(screen.getByRole('button'));

    expect(doc.getMap('user').get('locale')).toBe('en');
  });

  it('passes locale value through unchanged from outer context', () => {
    localStorage.setItem(STORAGE_KEY, 'en');
    const doc = makeDoc('en');
    renderWithDoc(doc);
    expect(screen.getByTestId('locale').textContent).toBe('en');
  });

  it('does not write to localStorage directly on setLocale (delegates to LocaleSynchronizer)', async () => {
    localStorage.setItem(STORAGE_KEY, 'sr-Latn');
    const doc = makeDoc('sr-Latn');
    const user = userEvent.setup();
    renderWithDoc(doc, 'ru');

    await user.click(screen.getByRole('button'));

    // CRDT write triggers LocaleSynchronizer which calls outer setLocale → writes localStorage
    expect(doc.getMap('user').get('locale')).toBe('ru');
    // localStorage is updated reactively via LocaleSynchronizer
    expect(localStorage.getItem(STORAGE_KEY)).toBe('ru');
  });
});
