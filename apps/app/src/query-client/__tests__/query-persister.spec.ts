import type { PersistedClient } from '@tanstack/react-query-persist-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { queryPersister } from '../query-persister';

function makeClient(overrides?: Partial<PersistedClient>): PersistedClient {
  return {
    timestamp: Date.now(),
    buster: '',
    clientState: { mutations: [], queries: [] },
    ...overrides,
  };
}

function setOnline(value: boolean) {
  vi.stubGlobal('navigator', { ...navigator, onLine: value });
}

describe('queryPersister — persistClient / removeClient', () => {
  it('persists a client to IDB', async () => {
    setOnline(false);
    const client = makeClient({ timestamp: 1000 });
    await queryPersister.persistClient(client);
    const restored = await queryPersister.restoreClient();
    expect(restored).toEqual(client);
  });

  it('overwrites on subsequent persist', async () => {
    setOnline(false);
    await queryPersister.persistClient(makeClient({ timestamp: 1000 }));
    const updated = makeClient({ timestamp: 2000 });
    await queryPersister.persistClient(updated);
    const restored = await queryPersister.restoreClient();
    expect(restored?.timestamp).toBe(2000);
  });

  it('removeClient deletes persisted data', async () => {
    setOnline(false);
    await queryPersister.persistClient(makeClient());
    await queryPersister.removeClient();
    const result = await queryPersister.restoreClient();
    expect(result).toBeUndefined();
  });

  it('removeClient is a no-op when nothing is stored', async () => {
    await expect(queryPersister.removeClient()).resolves.toBeUndefined();
  });
});

describe('queryPersister — restoreClient online gate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns undefined when online, even if data is persisted', async () => {
    setOnline(false);
    await queryPersister.persistClient(makeClient({ timestamp: 999 }));
    setOnline(true);
    const result = await queryPersister.restoreClient();
    expect(result).toBeUndefined();
  });

  it('returns persisted data when offline', async () => {
    setOnline(false);
    const client = makeClient({ timestamp: 42 });
    await queryPersister.persistClient(client);
    const result = await queryPersister.restoreClient();
    expect(result).toEqual(client);
  });

  it('returns undefined when offline and nothing persisted', async () => {
    setOnline(false);
    const result = await queryPersister.restoreClient();
    expect(result).toBeUndefined();
  });
});
