import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import { createSyncStateStore } from '../sync-state';

const STORAGE_KEY = 'autokpo:sync:test-user';
const store = createSyncStateStore('test-user');

describe('sync-state', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  describe('read', () => {
    it('returns { cursor: 0, stateVector: null, dirty: false, lastSuccessfulSyncAt: null } when no key exists', () => {
      const result = store.read();
      expect(result).toEqual({
        cursor: 0,
        stateVector: null,
        dirty: false,
        lastSuccessfulSyncAt: null,
      });
    });
  });

  describe('write and read round-trip', () => {
    it('round-trips cursor, stateVector, dirty, and lastSuccessfulSyncAt correctly', () => {
      const stateVector = new Uint8Array([1, 2, 3, 4, 5]);
      store.write({
        cursor: 42,
        stateVector,
        dirty: true,
        lastSuccessfulSyncAt: 1714567890000,
      });
      const result = store.read();
      expect(result.cursor).toBe(42);
      expect(result.stateVector).toEqual(stateVector);
      expect(result.dirty).toBe(true);
      expect(result.lastSuccessfulSyncAt).toBe(1714567890000);
    });

    it('round-trips cursor with null SV and dirty false', () => {
      store.write({
        cursor: 10,
        stateVector: null,
        dirty: false,
        lastSuccessfulSyncAt: null,
      });
      const result = store.read();
      expect(result.cursor).toBe(10);
      expect(result.stateVector).toBe(null);
      expect(result.dirty).toBe(false);
      expect(result.lastSuccessfulSyncAt).toBe(null);
    });

    it('writes cursor 0 with SV', () => {
      const stateVector = new Uint8Array([255, 0, 128]);
      store.write({
        cursor: 0,
        stateVector,
        dirty: false,
        lastSuccessfulSyncAt: null,
      });
      const result = store.read();
      expect(result.cursor).toBe(0);
      expect(result.stateVector).toEqual(stateVector);
      expect(result.dirty).toBe(false);
      expect(result.lastSuccessfulSyncAt).toBe(null);
    });
  });

  describe('reset', () => {
    it('clears cursor and stateVector but preserves dirty and lastSuccessfulSyncAt', () => {
      store.write({
        cursor: 99,
        stateVector: new Uint8Array([1]),
        dirty: true,
        lastSuccessfulSyncAt: 1714567890000,
      });
      store.reset();
      const result = store.read();
      expect(result.cursor).toBe(0);
      expect(result.stateVector).toBeNull();
      expect(result.dirty).toBe(true);
      expect(result.lastSuccessfulSyncAt).toBe(1714567890000);
    });

    it('preserves dirty=false through reset', () => {
      store.write({
        cursor: 50,
        stateVector: new Uint8Array([9, 8, 7]),
        dirty: false,
        lastSuccessfulSyncAt: 1714567890000,
      });
      store.reset();
      const result = store.read();
      expect(result).toEqual({
        cursor: 0,
        stateVector: null,
        dirty: false,
        lastSuccessfulSyncAt: 1714567890000,
      });
    });
  });

  describe('markDirty', () => {
    it('sets dirty to true while preserving cursor and stateVector', () => {
      const stateVector = new Uint8Array([10, 20, 30]);
      store.write({
        cursor: 15,
        stateVector,
        dirty: false,
        lastSuccessfulSyncAt: 1714567890000,
      });
      store.markDirty();
      const result = store.read();
      expect(result.cursor).toBe(15);
      expect(result.stateVector).toEqual(stateVector);
      expect(result.dirty).toBe(true);
      expect(result.lastSuccessfulSyncAt).toBe(1714567890000);
    });

    it('is idempotent when already dirty', () => {
      const stateVector = new Uint8Array([1]);
      store.write({
        cursor: 5,
        stateVector,
        dirty: true,
        lastSuccessfulSyncAt: null,
      });
      store.markDirty();
      const result = store.read();
      expect(result.dirty).toBe(true);
      expect(result.cursor).toBe(5);
    });

    it('works from default state', () => {
      store.markDirty();
      const result = store.read();
      expect(result).toEqual({
        cursor: 0,
        stateVector: null,
        dirty: true,
        lastSuccessfulSyncAt: null,
      });
    });
  });

  describe('base64 encode/decode fidelity', () => {
    it('handles all byte values 0-255 correctly', () => {
      const allBytes = new Uint8Array(256);
      for (let i = 0; i < 256; i++) allBytes[i] = i;
      store.write({
        cursor: 123,
        stateVector: allBytes,
        dirty: true,
        lastSuccessfulSyncAt: null,
      });
      const result = store.read();
      expect(result.stateVector).toEqual(allBytes);
      expect(result.cursor).toBe(123);
    });

    it('handles empty Uint8Array', () => {
      store.write({
        cursor: 5,
        stateVector: new Uint8Array(0),
        dirty: false,
        lastSuccessfulSyncAt: null,
      });
      const result = store.read();
      expect(result.stateVector).toEqual(new Uint8Array(0));
    });

    it('handles large SV', () => {
      const large = new Uint8Array(1000);
      for (let i = 0; i < 1000; i++) large[i] = i % 256;
      store.write({
        cursor: 200,
        stateVector: large,
        dirty: false,
        lastSuccessfulSyncAt: null,
      });
      const result = store.read();
      expect(result.stateVector).toEqual(large);
    });
  });

  describe('subscriptions', () => {
    it('notifies same-tab subscribers after write', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      store.write({
        cursor: 1,
        stateVector: null,
        dirty: false,
        lastSuccessfulSyncAt: 1714567890000,
      });

      expect(listener).toHaveBeenCalledTimes(1);
      unsubscribe();
    });

    it('notifies subscribers on storage event for autokpo:sync:*', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          oldValue: null,
          newValue: JSON.stringify({
            cursor: 10,
            stateVector: null,
            dirty: false,
            lastSuccessfulSyncAt: 1714567890000,
          }),
          storageArea: localStorage,
        }),
      );

      expect(listener).toHaveBeenCalledTimes(1);
      unsubscribe();
    });
  });
});
