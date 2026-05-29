import { z } from 'zod';

export const kdfParamsV1Schema = z.object({
  memorySize: z.number().int(),
  iterations: z.number().int(),
  parallelism: z.number().int(),
  hashLength: z.number().int(),
});

export const aesGcmParamsV1Schema = z.object({
  iv: z.string(),
  tagBits: z.number().int(),
});

const keyRingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  activeDekId: z.string(),
  revision: z.number().int().positive(),
  plaintextSchemaVersion: z.literal(1),
  encryptionAlgorithm: z.literal('aes-256-gcm'),
  encryptionParams: aesGcmParamsV1Schema,
  ciphertext: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const wrapperSchema = z.object({
  id: z.string(),
  userId: z.string(),
  method: z.literal('password'),
  kdfAlgorithm: z.literal('argon2id'),
  kdfParams: kdfParamsV1Schema,
  kdfSalt: z.string(),
  wrappingAlgorithm: z.literal('aes-256-gcm'),
  wrappingParams: aesGcmParamsV1Schema,
  ciphertext: z.string(),
  createdAt: z.string(),
});

export const serializedKeyRingProfileSchema = z.object({
  keyRing: keyRingSchema,
  wrappers: z.array(wrapperSchema).min(1),
});

export const createKeyRingProfileRequestSchema = z.object({
  keyRing: z.object({
    id: z.string(),
    activeDekId: z.string(),
    plaintextSchemaVersion: z.literal(1),
    encryptionAlgorithm: z.literal('aes-256-gcm'),
    encryptionParams: aesGcmParamsV1Schema,
    ciphertext: z.string(),
  }),
  mek: z.object({
    id: z.string(),
    kdfAlgorithm: z.literal('argon2id'),
    kdfParams: kdfParamsV1Schema,
    kdfSalt: z.string(),
    wrappingAlgorithm: z.literal('aes-256-gcm'),
    wrappingParams: aesGcmParamsV1Schema,
    ciphertext: z.string(),
  }),
});

export const changeMasterPasswordRequestSchema = z.object({
  currentWrappingId: z.string(),
  wrappingId: z.string(),
  kdfAlgorithm: z.literal('argon2id'),
  kdfParams: kdfParamsV1Schema,
  kdfSalt: z.string(),
  wrappingAlgorithm: z.literal('aes-256-gcm'),
  wrappingParams: aesGcmParamsV1Schema,
  ciphertext: z.string(),
});

export const updateKeyRingRequestSchema = z.object({
  currentRevision: z.number().int().positive(),
  activeDekId: z.string(),
  plaintextSchemaVersion: z.literal(1),
  encryptionAlgorithm: z.literal('aes-256-gcm'),
  encryptionParams: aesGcmParamsV1Schema,
  ciphertext: z.string(),
});

export type KdfParamsV1 = z.infer<typeof kdfParamsV1Schema>;
export type AesGcmParamsV1 = z.infer<typeof aesGcmParamsV1Schema>;
export type SerializedKeyRingProfile = z.infer<
  typeof serializedKeyRingProfileSchema
>;
export type CreateKeyRingProfileRequest = z.infer<
  typeof createKeyRingProfileRequestSchema
>;
export type ChangeMasterPasswordRequest = z.infer<
  typeof changeMasterPasswordRequestSchema
>;
export type UpdateKeyRingRequest = z.infer<typeof updateKeyRingRequestSchema>;

export const KDF_PARAMS_V1 = {
  memorySize: 65536,
  iterations: 3,
  parallelism: 1,
  hashLength: 32,
} as const satisfies KdfParamsV1;

export const AES_GCM_PARAMS_V1 = { tagBits: 128 } as const;

export function isSerializedKeyRingProfile(
  value: unknown,
  userId?: string,
): value is SerializedKeyRingProfile {
  const result = serializedKeyRingProfileSchema.safeParse(value);
  if (!result.success) return false;
  return (
    userId === undefined ||
    (result.data.keyRing.userId === userId &&
      result.data.wrappers.every((wrapper) => wrapper.userId === userId))
  );
}
