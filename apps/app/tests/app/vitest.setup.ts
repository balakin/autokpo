import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

import { afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.setItem('autokpo:locale', 'sr-Latn');
});

afterEach(async () => {
  const databases = await indexedDB.databases();
  await Promise.all(
    databases.map(
      ({ name }) =>
        new Promise<void>((resolve, reject) => {
          if (name === undefined) {
            resolve();
            return;
          }
          const request = indexedDB.deleteDatabase(name);
          request.onsuccess = () => resolve();
          request.onerror = () =>
            reject(toError(request.error, 'IndexedDB delete failed'));
          request.onblocked = () => resolve();
        }),
    ),
  );
});

// Web Locks API not implemented in jsdom.
// leader.ts calls navigator.locks.request() at module level; this stub keeps
// those calls from throwing so module initialization succeeds in tests.
// Locks are never actually granted (promises never resolve), which is correct
// because runtime.ts is not started in unit tests.
if (!('locks' in navigator)) {
  Object.defineProperty(navigator, 'locks', {
    value: {
      request: () => new Promise<void>(() => {}),
      query: () =>
        Promise.resolve({ held: [] as LockInfo[], pending: [] as LockInfo[] }),
    },
    configurable: true,
    writable: true,
  });
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Web Animations API not implemented in jsdom — required by react-aria Tabs transitions
Element.prototype.getAnimations = () => [];

// input-otp calls elementFromPoint in a timer; stub it to prevent uncaught errors in jsdom
document.elementFromPoint = () => null;

function toError(value: unknown, fallbackMessage: string): Error {
  return value instanceof Error ? value : new Error(fallbackMessage);
}
