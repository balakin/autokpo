import type { EntityProfile } from 'src/entity-profiles/entity-profile-schema';

export const VALID_PROFILE: EntityProfile = Object.freeze({
  pib: '123456789',
  obveznik: 'Test Obveznik',
  firmaRadnje: 'Test Firma',
  sediste: 'Beograd',
  sifraPoreskogObveznika: '12345678',
  sifraDelatnosti: '6201',
});
