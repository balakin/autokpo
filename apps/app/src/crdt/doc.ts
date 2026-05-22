import * as Y from 'yjs';

import {
  EncryptedIndexeddbPersistence,
  type EncryptedIndexeddbPersistenceOptions,
} from './encrypted-indexeddb-persistence';
import type { TypedDoc } from './typed-doc';

export type CrdtRuntime = {
  ydoc: TypedDoc;
  whenReady: Promise<EncryptedIndexeddbPersistence>;
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
    ydoc,
    whenReady: persistence.whenSynced,
    async destroy() {
      await persistence.destroy();
      ydoc.destroy();
    },
  };
}

export function bootstrap(ydoc: TypedDoc, initialLocale: string): void {
  ydoc.transact(() => {
    const meta = ydoc.getMap('meta');
    if (!meta.has('schemaVersion')) {
      meta.set('schemaVersion', 1);
    }
    if (!meta.has('createdAt')) {
      meta.set('createdAt', new Date().toISOString());
    }
    const user = ydoc.getMap('user');
    if (!user.has('locale')) {
      user.set('locale', initialLocale);
    }
  });
}
