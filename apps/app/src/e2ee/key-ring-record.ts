import { z } from 'zod';

export const kdfParamsV1Schema = z.object({
  memorySize: z.number().int(),
  iterations: z.number().int(),
  parallelism: z.number().int(),
  hashLength: z.number().int(),
});

export const wrappingParamsV1Schema = z.object({
  ivBytes: z.number().int(),
  tagBits: z.number().int(),
});

const keyRingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  activeDekId: z.string(),
  encryptionVersion: z.literal(1),
  encryptionAlgorithm: z.literal('aes-256-gcm'),
  iv: z.string(),
  ciphertext: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const wrapperSchema = z.object({
  id: z.string(),
  userId: z.string(),
  method: z.literal('password'),
  kdfVersion: z.literal(1),
  kdfAlgorithm: z.literal('argon2id'),
  kdfParams: kdfParamsV1Schema,
  kdfSalt: z.string(),
  wrappingVersion: z.literal(1),
  wrappingAlgorithm: z.literal('aes-256-gcm'),
  wrappingParams: wrappingParamsV1Schema,
  wrappingIv: z.string(),
  ciphertext: z.string(),
  createdAt: z.string(),
});

export const serializedKeyRingProfileSchema = z.object({
  keyRing: keyRingSchema,
  wrappers: z.array(wrapperSchema).min(1),
});

export const createKeyRingProfileRequestSchema = z.object({
  keyRingId: z.string(),
  wrappingId: z.string(),
  activeDekId: z.string(),
  encryptionVersion: z.literal(1),
  encryptionAlgorithm: z.literal('aes-256-gcm'),
  keyRingIv: z.string(),
  keyRingCiphertext: z.string(),
  kdfVersion: z.literal(1),
  kdfAlgorithm: z.literal('argon2id'),
  kdfParams: kdfParamsV1Schema,
  kdfSalt: z.string(),
  wrappingVersion: z.literal(1),
  wrappingAlgorithm: z.literal('aes-256-gcm'),
  wrappingParams: wrappingParamsV1Schema,
  wrappingIv: z.string(),
  ciphertext: z.string(),
});

export type KdfParamsV1 = z.infer<typeof kdfParamsV1Schema>;
export type WrappingParamsV1 = z.infer<typeof wrappingParamsV1Schema>;
export type SerializedKeyRingProfile = z.infer<
  typeof serializedKeyRingProfileSchema
>;
export type CreateKeyRingProfileRequest = z.infer<
  typeof createKeyRingProfileRequestSchema
>;
export type WrapParamsV1 = WrappingParamsV1;

export const KDF_PARAMS_V1 = {
  memorySize: 65536,
  iterations: 3,
  parallelism: 1,
  hashLength: 32,
} as const satisfies KdfParamsV1;

export const WRAPPING_PARAMS_V1 = {
  ivBytes: 12,
  tagBits: 128,
} as const satisfies WrappingParamsV1;

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
