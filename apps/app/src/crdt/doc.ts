import * as Y from 'yjs';

import {
  EncryptedIndexeddbPersistence,
  type EncryptedIndexeddbPersistenceOptions,
} from './encrypted-indexeddb-persistence';
import type { TypedDoc } from './typed-doc';
import { encodeStateAsUpdate } from './y';

export type CrdtRuntime = {
  persistence: EncryptedIndexeddbPersistence;
  ydoc: TypedDoc;
  whenReady: Promise<EncryptedIndexeddbPersistence>;
  persistSnapshot(): Promise<void>;
  destroy(): Promise<void>;
};

export function createRuntime(
  userId: string,
  encryption: EncryptedIndexeddbPersistenceOptions,
): CrdtRuntime {
  const ydoc = new Y.Doc() as unknown as TypedDoc;
  const persistence = new EncryptedIndexeddbPersistence(
    `autokpo-yjs:${userId}`,
    ydoc as unknown as Y.Doc,
    encryption,
  );

  return {
    persistence,
    ydoc,
    whenReady: persistence.whenSynced,
    persistSnapshot() {
      return persistence.persistLocalUpdate(encodeStateAsUpdate(ydoc));
    },
    async destroy() {
      await persistence.destroy();
      ydoc.destroy();
    },
  };
}

export function bootstrap(ydoc: TypedDoc, initialLocale: string): boolean {
  let changed = false;
  ydoc.transact(() => {
    const meta = ydoc.getMap('meta');
    if (!meta.has('schemaVersion')) {
      meta.set('schemaVersion', 1);
      changed = true;
    }
    if (!meta.has('createdAt')) {
      meta.set('createdAt', new Date().toISOString());
      changed = true;
    }
    const user = ydoc.getMap('user');
    if (!user.has('locale')) {
      user.set('locale', initialLocale);
      changed = true;
    }
  });
  return changed;
}
