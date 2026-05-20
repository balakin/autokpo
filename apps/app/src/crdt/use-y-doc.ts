import { useMemo } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';

import { shallowEqual } from '../utils/shallow-equal';

import type { TypedDoc } from './typed-doc';
import { useDoc } from './use-doc';

type Subscriber = () => void;

function subscribeToDoc(
  doc: TypedDoc,
  version: { v: number },
  cb: Subscriber,
): () => void {
  const handler = () => {
    version.v++;
    cb();
  };
  doc.on('afterTransaction', handler);
  return () => {
    doc.off('afterTransaction', handler);
  };
}

// useSyncExternalStoreWithSelector memoizes based on Object.is(memoizedSnapshot,
// nextSnapshot). If getSnapshot always returns the same mutable Y.Doc reference,
// the selector is never re-run after the first render. We therefore use an
// incrementing version counter as the snapshot — a primitive that changes on
// every afterTransaction, so Object.is detects the change.

export function useYDoc<T>(
  selector: (doc: TypedDoc) => T,
  isEqual?: (a: T, b: T) => boolean,
): T {
  const doc = useDoc();

  // useMemo ensures subscribe/getVersion are stable for the same doc
  // and recreated (with a fresh version counter) when doc changes.
  const { subscribe, getVersion } = useMemo(() => {
    const version = { v: 0 };
    return {
      subscribe: (cb: Subscriber) => subscribeToDoc(doc, version, cb),
      getVersion: () => version.v,
    };
  }, [doc]);

  const capturedDoc = doc;

  return useSyncExternalStoreWithSelector(
    subscribe,
    getVersion,
    getVersion,
    () => selector(capturedDoc),
    isEqual ?? shallowEqual,
  );
}
