import { z } from 'zod';

export const kdfParamsV1Schema = z.object({
  memorySize: z.number().int(),
  iterations: z.number().int(),
  parallelism: z.number().int(),
  hashLength: z.number().int(),
});

export const wrapParamsV1Schema = z.object({
  ivBytes: z.number().int(),
  tagBits: z.number().int(),
});

const encryptionKeySchema = z.object({
  keyId: z.string(),
  userId: z.string(),
  createdAt: z.string(),
  revokedAt: z.string().nullable(),
});

const encryptionKeyWrappingSchema = z.object({
  wrappingId: z.string(),
  keyId: z.string(),
  userId: z.string(),
  method: z.literal('password'),
  kdfVersion: z.literal(1),
  kdfAlgorithm: z.literal('argon2id'),
  kdfParams: kdfParamsV1Schema,
  kdfSalt: z.string(),
  wrapVersion: z.literal(1),
  wrapAlgorithm: z.literal('aes-256-gcm'),
  wrapParams: wrapParamsV1Schema,
  wrapIv: z.string(),
  wrappedMasterKey: z.string(),
  createdAt: z.string(),
  revokedAt: z.string().nullable(),
});

export const serializedEncryptionKeyRecordSchema = z
  .object({
    version: z.literal(1),
    key: encryptionKeySchema,
    wrapping: encryptionKeyWrappingSchema,
  })
  .refine((record) => record.key.keyId === record.wrapping.keyId, {
    path: ['wrapping', 'keyId'],
  })
  .refine((record) => record.key.userId === record.wrapping.userId, {
    path: ['wrapping', 'userId'],
  });

export const createEncryptionKeyRequestSchema = z.object({
  keyId: z.string(),
  wrappingId: z.string(),
  kdfVersion: z.literal(1),
  kdfAlgorithm: z.literal('argon2id'),
  kdfParams: kdfParamsV1Schema,
  kdfSalt: z.string(),
  wrapVersion: z.literal(1),
  wrapAlgorithm: z.literal('aes-256-gcm'),
  wrapParams: wrapParamsV1Schema,
  wrapIv: z.string(),
  wrappedMasterKey: z.string(),
});

export type KdfParamsV1 = z.infer<typeof kdfParamsV1Schema>;
export type WrapParamsV1 = z.infer<typeof wrapParamsV1Schema>;
export type SerializedEncryptionKeyRecord = z.infer<
  typeof serializedEncryptionKeyRecordSchema
>;
export type CreateEncryptionKeyRequest = z.infer<
  typeof createEncryptionKeyRequestSchema
>;

export const KDF_PARAMS_V1 = {
  memorySize: 65536,
  iterations: 3,
  parallelism: 1,
  hashLength: 32,
} as const satisfies KdfParamsV1;

export const WRAP_PARAMS_V1 = {
  ivBytes: 12,
  tagBits: 128,
} as const satisfies WrapParamsV1;

export function isSerializedEncryptionKeyRecord(
  value: unknown,
  userId?: string,
): value is SerializedEncryptionKeyRecord {
  const result = serializedEncryptionKeyRecordSchema.safeParse(value);
  if (!result.success) return false;
  return userId === undefined || result.data.key.userId === userId;
}
