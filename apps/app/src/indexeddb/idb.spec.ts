import { afterEach, describe, expect, it } from 'vitest';

import {
  deleteDatabase,
  openDatabase,
  requestToPromise,
  toError,
  withStore,
  withStores,
} from './idb';

const DB_NAME = 'test-idb';
const STORE_NAME = 'items';
const META_STORE_NAME = 'meta';

const dbs: IDBDatabase[] = [];

afterEach(() => {
  dbs.splice(0).forEach((db) => db.close());
});

function openTestDb(): Promise<IDBDatabase> {
  return openDatabase(DB_NAME, 1, (db) => {
    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    db.createObjectStore(META_STORE_NAME, { keyPath: 'id' });
  }).then((db) => {
    dbs.push(db);
    return db;
  });
}

describe('openDatabase', () => {
  it('creates object stores in the upgrade callback', async () => {
    const db = await openTestDb();
    expect(db.objectStoreNames.contains(STORE_NAME)).toBe(true);
  });

  it('returns the same db on subsequent opens', async () => {
    const db1 = await openTestDb();
    const db2 = await openTestDb();
    expect(db1.name).toBe(db2.name);
  });
});

describe('deleteDatabase', () => {
  it('deletes an existing database and returns true', async () => {
    await openTestDb();
    dbs.length = 0; // will be closed by afterEach no-op; already tracked
    const result = await deleteDatabase(DB_NAME);
    expect(result).toBe(true);
  });
});

describe('withStore', () => {
  it('writes and reads a record', async () => {
    const db = await openTestDb();
    await withStore(db, STORE_NAME, 'readwrite', (store) =>
      requestToPromise(store.put({ id: 'k1', value: 'hello' })),
    );
    const record = await withStore(db, STORE_NAME, 'readonly', (store) =>
      requestToPromise<unknown>(store.get('k1')),
    );
    expect(record).toEqual({ id: 'k1', value: 'hello' });
  });

  it('resolves with undefined for a missing key', async () => {
    const db = await openTestDb();
    const record = await withStore(db, STORE_NAME, 'readonly', (store) =>
      requestToPromise<unknown>(store.get('missing')),
    );
    expect(record).toBeUndefined();
  });

  it('rejects when the operation throws', async () => {
    const db = await openTestDb();
    await expect(
      withStore(db, STORE_NAME, 'readwrite', () =>
        Promise.reject(new Error('boom')),
      ),
    ).rejects.toThrow('boom');
  });
});

describe('withStores', () => {
  it('writes and reads records across multiple stores in one transaction', async () => {
    const db = await openTestDb();

    await withStores(
      db,
      [STORE_NAME, META_STORE_NAME],
      'readwrite',
      async (stores) => {
        await Promise.all([
          requestToPromise(
            stores.get(STORE_NAME)!.put({ id: 'k1', value: 'hello' }),
          ),
          requestToPromise(
            stores.get(META_STORE_NAME)!.put({ id: 'active', value: 'meta' }),
          ),
        ]);
      },
    );

    const records = await withStores(
      db,
      [STORE_NAME, META_STORE_NAME],
      'readonly',
      async (stores) => {
        const [item, meta] = await Promise.all([
          requestToPromise<unknown>(stores.get(STORE_NAME)!.get('k1')),
          requestToPromise<unknown>(stores.get(META_STORE_NAME)!.get('active')),
        ]);
        return { item, meta };
      },
    );

    expect(records).toEqual({
      item: { id: 'k1', value: 'hello' },
      meta: { id: 'active', value: 'meta' },
    });
  });

  it('aborts all store writes when the operation rejects', async () => {
    const db = await openTestDb();

    await expect(
      withStores(
        db,
        [STORE_NAME, META_STORE_NAME],
        'readwrite',
        async (stores) => {
          await requestToPromise(
            stores.get(STORE_NAME)!.put({ id: 'k1', value: 'hello' }),
          );
          await requestToPromise(
            stores.get(META_STORE_NAME)!.put({ id: 'active', value: 'meta' }),
          );
          throw new Error('boom');
        },
      ),
    ).rejects.toThrow('boom');

    const records = await withStores(
      db,
      [STORE_NAME, META_STORE_NAME],
      'readonly',
      async (stores) => {
        const [item, meta] = await Promise.all([
          requestToPromise<unknown>(stores.get(STORE_NAME)!.get('k1')),
          requestToPromise<unknown>(stores.get(META_STORE_NAME)!.get('active')),
        ]);
        return { item, meta };
      },
    );

    expect(records).toEqual({ item: undefined, meta: undefined });
  });
});

describe('toError', () => {
  it('returns the error as-is when it is an Error', () => {
    const err = new Error('original');
    expect(toError(err, 'fallback')).toBe(err);
  });

  it('wraps non-Error values with the fallback message', () => {
    expect(toError('string error', 'fallback')).toEqual(new Error('fallback'));
    expect(toError(null, 'fallback')).toEqual(new Error('fallback'));
  });
});
