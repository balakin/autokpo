import type * as Y from 'yjs';

import type { Book } from '../books/book-schema';
import type { EntityProfile } from '../entity-profiles/entity-profile-schema';
import type { KpoEntry } from '../entries/entries-schema';
import type { Signature } from '../signatures/signature-schema';

export type TypedMap<T extends Record<string, unknown>> = Omit<
  Y.Map<unknown>,
  'get' | 'set' | 'has' | 'delete' | 'toJSON'
> & {
  get<K extends keyof T & string>(key: K): T[K] | undefined;
  set<K extends keyof T & string>(key: K, value: T[K]): void;
  has(key: keyof T & string): boolean;
  delete(key: keyof T & string): void;
  toJSON(): T;
};

export type BookMapData = Omit<Book, 'entries' | 'profile' | 'signature'> & {
  entries: Y.Array<TypedMap<KpoEntry>>;
  profile: TypedMap<EntityProfile> | undefined;
  signature: TypedMap<Signature> | undefined;
};

type DocMeta = {
  schemaVersion: number;
  serverCursor: number;
};

type DocUser = {
  locale: string;
};

type AppDocMaps = {
  books: Y.Map<TypedMap<BookMapData>>;
  meta: TypedMap<DocMeta>;
  user: TypedMap<DocUser>;
};

export type TypedDoc = Omit<Y.Doc, 'getMap'> & {
  getMap<K extends keyof AppDocMaps>(name: K): AppDocMaps[K];
};
