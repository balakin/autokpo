import { YArray, YMap } from '../crdt';
import type { TypedDoc } from '../crdt/typed-doc';

import type { KpoEntry } from './entries-schema';

function add(doc: TypedDoc, bookId: string, entry: KpoEntry): void {
  doc.transact(() => {
    const yBook = doc.getMap('books').get(bookId);
    if (!yBook) return;

    let yEntries = yBook.get('entries');
    if (!yEntries) {
      yEntries = new YArray<KpoEntry>();
      yBook.set('entries', yEntries);
    }

    const yEntry = new YMap<KpoEntry>();
    yEntry.set('id', entry.id);
    yEntry.set('datumPrometa', entry.datumPrometa);
    yEntry.set('opisPrometa', entry.opisPrometa);
    yEntry.set('odProdajeProizvoda', entry.odProdajeProizvoda);
    yEntry.set('odIzvrsenihUsluga', entry.odIzvrsenihUsluga);
    yEntries.push([yEntry]);
  });
}

function update(doc: TypedDoc, bookId: string, entry: KpoEntry): void {
  doc.transact(() => {
    const yBook = doc.getMap('books').get(bookId);
    if (!yBook) return;

    const yEntries = yBook.get('entries');
    if (!yEntries) return;

    const idx = yEntries.toArray().findIndex((e) => e.get('id') === entry.id);
    if (idx === -1) return;

    const yEntry = yEntries.get(idx);
    yEntry.set('datumPrometa', entry.datumPrometa);
    yEntry.set('opisPrometa', entry.opisPrometa);
    yEntry.set('odProdajeProizvoda', entry.odProdajeProizvoda);
    yEntry.set('odIzvrsenihUsluga', entry.odIzvrsenihUsluga);
  });
}

function remove(doc: TypedDoc, bookId: string, id: string): void {
  doc.transact(() => {
    const yBook = doc.getMap('books').get(bookId);
    if (!yBook) return;

    const yEntries = yBook.get('entries');
    if (!yEntries) return;

    const idx = yEntries.toArray().findIndex((e) => e.get('id') === id);
    if (idx === -1) return;

    yEntries.delete(idx);
  });
}

export const entryMutations = {
  add,
  update,
  remove,
};
