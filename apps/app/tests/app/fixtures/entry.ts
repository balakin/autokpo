import type { KpoEntry } from 'src/entries/entries-schema';

export const VALID_ENTRY: KpoEntry = Object.freeze({
  id: '00000000-0000-4000-8000-000000000001',
  datumPrometa: '2025-03-15',
  opisPrometa: 'Prihod od prodaje robe',
  odProdajeProizvoda: 50000,
  odIzvrsenihUsluga: 0,
});

export const VALID_ENTRY_2: KpoEntry = Object.freeze({
  id: '00000000-0000-4000-8000-000000000002',
  datumPrometa: '2025-01-10',
  opisPrometa: 'Prihod od usluga',
  odProdajeProizvoda: 0,
  odIzvrsenihUsluga: 30000,
});
