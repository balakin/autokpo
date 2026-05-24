export function openDatabase(
  name: string,
  version: number,
  onUpgrade: (db: IDBDatabase) => void,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);

    request.onupgradeneeded = () => {
      onUpgrade(request.result);
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () =>
      reject(toError(request.error, 'IndexedDB open failed'));
    request.onblocked = () => reject(request.error ?? new Error('Blocked'));
  });
}

export function deleteDatabase(name: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve(true);
    request.onerror = () =>
      reject(toError(request.error, 'IndexedDB delete failed'));
    request.onblocked = () => resolve(false);
  });
}

export function withStore<T>(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let result: T;

    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () =>
      reject(toError(transaction.error, 'IndexedDB transaction failed'));
    transaction.onabort = () =>
      reject(toError(transaction.error, 'IndexedDB transaction aborted'));

    operation(store).then(
      (value) => {
        result = value;
      },
      (error: unknown) => {
        reject(toError(error, 'IndexedDB operation failed'));
        try {
          transaction.abort();
        } catch {
          // Transaction may already be completed or aborted.
        }
      },
    );
  });
}

export function withStores<T>(
  db: IDBDatabase,
  storeNames: string[],
  mode: IDBTransactionMode,
  operation: (stores: Map<string, IDBObjectStore>) => Promise<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeNames, mode);
    const stores = new Map(
      storeNames.map((storeName) => [
        storeName,
        transaction.objectStore(storeName),
      ]),
    );
    let result: T;

    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () =>
      reject(toError(transaction.error, 'IndexedDB transaction failed'));
    transaction.onabort = () =>
      reject(toError(transaction.error, 'IndexedDB transaction aborted'));

    operation(stores).then(
      (value) => {
        result = value;
      },
      (error: unknown) => {
        reject(toError(error, 'IndexedDB operation failed'));
        try {
          transaction.abort();
        } catch {
          // Transaction may already be completed or aborted.
        }
      },
    );
  });
}

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(toError(request.error, 'IndexedDB request failed'));
  });
}

export function toError(value: unknown, fallbackMessage: string): Error {
  return value instanceof Error ? value : new Error(fallbackMessage);
}
