import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  localStorage.setItem('autokpo:locale', 'sr-Latn');
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

// Mock y-indexeddb for tests
vi.mock('y-indexeddb', () => {
  return {
    IndexeddbPersistence: class IndexeddbPersistence {
      whenSynced: Promise<this>;

      constructor() {
        this.whenSynced = Promise.resolve(this);
      }

      destroy(): Promise<void> {
        return Promise.resolve();
      }
    },
  };
});
