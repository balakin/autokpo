import { YMap } from '../crdt';
import type { TypedDoc } from '../crdt/typed-doc';

import type { Signature } from './signature-schema';

function save(doc: TypedDoc, bookId: string, signature: Signature): void {
  doc.transact(() => {
    const yBook = doc.getMap('books').get(bookId);
    if (!yBook) return;

    let ySignature = yBook.get('signature');
    if (!ySignature) {
      ySignature = new YMap<Signature>();
      yBook.set('signature', ySignature);
    }

    ySignature.set('sastavioIme', signature.sastavioIme);
    ySignature.set('odgovornoLiceIme', signature.odgovornoLiceIme);
  });
}

export const signatureMutations = {
  save,
};
