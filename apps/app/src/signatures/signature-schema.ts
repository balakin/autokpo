import { t } from '@lingui/core/macro';
import { z } from 'zod';

export const signatureSchema = z.object({
  sastavioIme: z.string().min(1),
  odgovornoLiceIme: z.string().min(1),
});

export type Signature = z.infer<typeof signatureSchema>;

export function createSignatureSchema() {
  return z.object({
    sastavioIme: z.string().min(1, t`Polje je obavezno`),
    odgovornoLiceIme: z.string().min(1, t`Polje je obavezno`),
  });
}
