import { t } from '@lingui/core/macro';
import { z } from 'zod';

export const entityProfileSchema = z.object({
  pib: z
    .string()
    .min(1)
    .regex(/^\d+$/)
    .regex(/^\d{9}$/),
  obveznik: z.string().min(1),
  firmaRadnje: z.string().min(1),
  sediste: z.string().min(1),
  sifraPoreskogObveznika: z
    .string()
    .min(1)
    .regex(/^\d{8}$/),
  sifraDelatnosti: z
    .string()
    .min(1)
    .regex(/^\d{4}$/),
});

export type EntityProfile = z.infer<typeof entityProfileSchema>;

export function createEntityProfileSchema() {
  return z.object({
    pib: z
      .string()
      .min(1, t`Polje je obavezno`)
      .regex(/^\d+$/, t`PIB mora sadržati samo cifre`)
      .regex(/^\d{9}$/, t`PIB mora imati tačno 9 cifara`),
    obveznik: z.string().min(1, t`Polje je obavezno`),
    firmaRadnje: z.string().min(1, t`Polje je obavezno`),
    sediste: z.string().min(1, t`Polje je obavezno`),
    sifraPoreskogObveznika: z
      .string()
      .min(1, t`Polje je obavezno`)
      .regex(/^\d{8}$/, t`Šifra poreskog obveznika mora imati tačno 8 cifara`),
    sifraDelatnosti: z
      .string()
      .min(1, t`Polje je obavezno`)
      .regex(/^\d{4}$/, t`Šifra delatnosti mora imati tačno 4 cifre`),
  });
}
