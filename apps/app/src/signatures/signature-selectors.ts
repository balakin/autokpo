import type { TypedDoc } from '../crdt/typed-doc';

import type { Signature } from './signature-schema';

function active(doc: TypedDoc, bookId: string): Signature | null {
  const yBook = doc.getMap('books').get(bookId);
  if (!yBook?.has('signature')) return null;
  const ySignature = yBook.get('signature')!;
  return ySignature.toJSON();
}

export const signatureSelectors = {
  active: (bookId: string) => (doc: TypedDoc) => active(doc, bookId),
};
