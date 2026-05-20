import { IndexeddbPersistence } from 'y-indexeddb';
import * as Y from 'yjs';

import type { TypedDoc } from './typed-doc';

export type CrdtRuntime = {
  ydoc: TypedDoc;
  whenReady: Promise<IndexeddbPersistence>;
  destroy(): Promise<void>;
};

export function createRuntime(userId: string): CrdtRuntime {
  const ydoc = new Y.Doc() as unknown as TypedDoc;
  const persistence = new IndexeddbPersistence(
    `autokpo-yjs:${userId}`,
    ydoc as unknown as Y.Doc,
  );

  return {
    ydoc,
    whenReady: persistence.whenSynced,
    destroy() {
      ydoc.destroy();
      return persistence.destroy();
    },
  };
}

export function bootstrap(ydoc: TypedDoc, initialLocale: string): void {
  ydoc.transact(() => {
    const meta = ydoc.getMap('meta');
    if (!meta.has('schemaVersion')) {
      meta.set('schemaVersion', 1);
    }
    const user = ydoc.getMap('user');
    if (!user.has('locale')) {
      user.set('locale', initialLocale);
    }
  });
}
