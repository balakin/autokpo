import type { Book } from '../books/book-schema';
import type { EntityProfile } from '../entity-profiles/entity-profile-schema';
import type { KpoEntry } from '../entries/entries-schema';
import type { Signature } from '../signatures/signature-schema';

import type { BookMapData, TypedMap } from './typed-doc';

export function yMapToBook(yBook: TypedMap<BookMapData>): Book {
  const entries = yBook.get('entries');
  const profile = yBook.get('profile');
  const signature = yBook.get('signature');
  return {
    id: yBook.get('id')!,
    year: yBook.get('year')!,
    createdAt: yBook.get('createdAt')!,
    favorite: yBook.get('favorite') ?? false,
    entries: entries ? entries.toArray().map(yMapToEntry) : [],
    profile: profile ? profile.toJSON() : null,
    signature: signature ? signature.toJSON() : null,
  };
}

export function yMapToEntry(yEntry: TypedMap<KpoEntry>): KpoEntry {
  return yEntry.toJSON();
}

export function yMapToProfile(
  yProfile: TypedMap<EntityProfile>,
): EntityProfile {
  return yProfile.toJSON();
}

export function yMapToSignature(ySignature: TypedMap<Signature>): Signature {
  return ySignature.toJSON();
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== 'object' ||
    a === null ||
    typeof b !== 'object' ||
    b === null
  )
    return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) =>
    deepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  );
}
