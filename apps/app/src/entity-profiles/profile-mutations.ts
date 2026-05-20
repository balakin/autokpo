import { YMap } from '../crdt';
import type { TypedDoc } from '../crdt/typed-doc';

import type { EntityProfile } from './entity-profile-schema';

function save(doc: TypedDoc, bookId: string, profile: EntityProfile): void {
  doc.transact(() => {
    const yBook = doc.getMap('books').get(bookId);
    if (!yBook) return;

    let yProfile = yBook.get('profile');
    if (!yProfile) {
      yProfile = new YMap<EntityProfile>();
      yBook.set('profile', yProfile);
    }

    yProfile.set('pib', profile.pib);
    yProfile.set('obveznik', profile.obveznik);
    yProfile.set('firmaRadnje', profile.firmaRadnje);
    yProfile.set('sediste', profile.sediste);
    yProfile.set('sifraPoreskogObveznika', profile.sifraPoreskogObveznika);
    yProfile.set('sifraDelatnosti', profile.sifraDelatnosti);
  });
}

export const profileMutations = {
  save,
};
