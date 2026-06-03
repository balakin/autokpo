import type {
  Persister,
  PersistedClient,
} from '@tanstack/react-query-persist-client';

import { openDatabase, requestToPromise, withStore } from '../indexeddb/idb';

const DB_NAME = 'autokpo-query-persist';
const DB_VERSION = 1;
const STORE_NAME = 'query-cache';
const CACHE_KEY = 'cache';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabase(DB_NAME, DB_VERSION, (db) => {
      db.createObjectStore(STORE_NAME);
    }).then((db) => {
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      return db;
    });
  }
  return dbPromise;
}

function createQueryPersister(): Persister {
  return {
    async persistClient(client: PersistedClient): Promise<void> {
      const db = await getDb();
      await withStore(db, STORE_NAME, 'readwrite', (store) =>
        requestToPromise(store.put(client, CACHE_KEY)),
      );
    },
    async restoreClient(): Promise<PersistedClient | undefined> {
      if (navigator.onLine) return undefined;
      const db = await getDb();
      const result = await withStore(db, STORE_NAME, 'readonly', (store) =>
        requestToPromise(
          store.get(CACHE_KEY) as IDBRequest<PersistedClient | undefined>,
        ),
      );
      return result ?? undefined;
    },
    async removeClient(): Promise<void> {
      const db = await getDb();
      await withStore(db, STORE_NAME, 'readwrite', (store) =>
        requestToPromise(store.delete(CACHE_KEY)),
      );
    },
  };
}

export const queryPersister = createQueryPersister();

export async function clearQueriesCache(): Promise<void> {
  return queryPersister.removeClient();
}
