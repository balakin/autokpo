import { z } from 'zod';

import { entityProfileSchema } from '../entity-profiles/entity-profile-schema';
import { signatureSchema } from '../signatures/signature-schema';

const storedEntrySchema = z.object({
  id: z.uuid(),
  datumPrometa: z
    .string()
    .min(1)
    .regex(/^\d{4}-\d{2}-\d{2}$/),
  opisPrometa: z.string().min(1),
  odProdajeProizvoda: z.number().min(0),
  odIzvrsenihUsluga: z.number().min(0),
});

export const bookSchema = z.object({
  id: z.uuid(),
  year: z.number().int(),
  profile: entityProfileSchema.nullable(),
  signature: signatureSchema.nullable(),
  entries: z.array(storedEntrySchema),
  createdAt: z.iso.datetime(),
  favorite: z.boolean().default(false),
});

export type Book = z.infer<typeof bookSchema>;

export const booksSchema = z.array(bookSchema);
