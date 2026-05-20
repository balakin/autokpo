import { yMapToProfile } from '../crdt';
import type { TypedDoc } from '../crdt/typed-doc';

import type { EntityProfile } from './entity-profile-schema';

function active(doc: TypedDoc, bookId: string): EntityProfile | null {
  const yBook = doc.getMap('books').get(bookId);
  if (!yBook?.has('profile')) return null;
  return yMapToProfile(yBook.get('profile')!);
}

export const profileSelectors = {
  active: (bookId: string) => (doc: TypedDoc) => active(doc, bookId),
};
