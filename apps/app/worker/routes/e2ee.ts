import { and, eq, isNull } from 'drizzle-orm';
import { Hono } from 'hono';

import {
  AES_GCM_IV_BYTES,
  KDF_SALT_BYTES,
  MAX_E2EE_BODY_BYTES,
  MAX_KEY_RING_CIPHERTEXT_BYTES,
  WRAPPED_MEK_CIPHERTEXT_BYTES,
  maxBase64Length,
} from '../constants';
import type { WorkerHonoEnv } from '../context';
import { getDb } from '../db';
import { assertExists } from '../db/assert';
import {
  keyRing,
  keyRingWrapping,
  type KeyRingRow,
  type KeyRingWrappingRow,
} from '../db/schema';
import { requireAuth } from '../middlewares/auth';
import { payloadLimit } from '../middlewares/payload-limit';
import { rateLimitRouteGroup } from '../middlewares/rate-limit';

const KDF_PARAMS_V1 = {
  memorySize: 65536,
  iterations: 3,
  parallelism: 1,
  hashLength: 32,
} as const;

const MAX_KEY_RING_CIPHERTEXT_BASE64_LENGTH = maxBase64Length(
  MAX_KEY_RING_CIPHERTEXT_BYTES,
);
const KDF_SALT_BASE64_LENGTH = maxBase64Length(KDF_SALT_BYTES);
const WRAPPED_MEK_CIPHERTEXT_BASE64_LENGTH = maxBase64Length(
  WRAPPED_MEK_CIPHERTEXT_BYTES,
);
const AES_GCM_IV_BASE64_LENGTH = maxBase64Length(AES_GCM_IV_BYTES);

export const e2eeRouter = new Hono<WorkerHonoEnv>();

e2eeRouter.use(
  '*',
  payloadLimit(MAX_E2EE_BODY_BYTES),
  requireAuth,
  rateLimitRouteGroup('e2ee'),
);

e2eeRouter.get('/key-ring', async (c) => {
  const session = c.get('session');

  const db = getDb(c.env.DB);
  const [[keyRingRow], [wrapping]] = await db.batch([
    db
      .select()
      .from(keyRing)
      .where(eq(keyRing.userId, session.user.id))
      .limit(1),
    db
      .select()
      .from(keyRingWrapping)
      .where(
        and(
          eq(keyRingWrapping.userId, session.user.id),
          eq(keyRingWrapping.method, 'password'),
          eq(keyRingWrapping.status, 'active'),
          isNull(keyRingWrapping.revokedAt),
        ),
      )
      .limit(1),
  ]);
  if (keyRingRow && wrapping) {
    return c.json(serializeRecord(keyRingRow, wrapping));
  }

  return c.json({ code: 'encryption_key_not_found' }, 404);
});

e2eeRouter.post('/key-ring', async (c) => {
  const session = c.get('session');

  if (c.req.header('Content-Type') !== 'application/json') {
    return c.json({ code: 'unsupported_content_type' }, 415);
  }

  const body: unknown = await c.req.json().catch(() => null);
  const parsed = parseCreateBody(body);
  if (parsed instanceof Response) return parsed;

  const db = getDb(c.env.DB);
  try {
    const [[keyRingRow], [wrapping]] = await db.batch([
      db
        .insert(keyRing)
        .values({
          id: parsed.keyRingId,
          userId: session.user.id,
          activeDekId: parsed.activeDekId,
          revision: 1,
          plaintextSchemaVersion: parsed.plaintextSchemaVersion,
          encryptionAlgorithm: 'aes-256-gcm',
          encryptionParams: JSON.stringify(parsed.encryptionParams),
          ciphertext: parsed.keyRingCiphertext,
        })
        .returning(),
      db
        .insert(keyRingWrapping)
        .values({
          id: parsed.wrappingId,
          userId: session.user.id,
          method: 'password',
          status: 'active',
          kdfAlgorithm: 'argon2id',
          kdfParams: JSON.stringify(KDF_PARAMS_V1),
          kdfSalt: parsed.kdfSalt,
          wrappingAlgorithm: 'aes-256-gcm',
          wrappingParams: JSON.stringify(parsed.wrappingParams),
          ciphertext: parsed.wrappedMek,
        })
        .returning(),
    ]);
    return c.json(serializeRecord(keyRingRow, wrapping), 201);
  } catch {
    return c.json({ code: 'encryption_key_already_exists' }, 409);
  }
});

e2eeRouter.put('/key-ring', async (c) => {
  const session = c.get('session');

  if (c.req.header('Content-Type') !== 'application/json') {
    return c.json({ code: 'unsupported_content_type' }, 415);
  }

  const body: unknown = await c.req.json().catch(() => null);
  const parsed = parseUpdateBody(body);
  if (parsed instanceof Response) return parsed;

  const db = getDb(c.env.DB);
  try {
    const [[keyRingRow], , [wrapping]] = await db.batch([
      db
        .update(keyRing)
        .set({
          activeDekId: parsed.activeDekId,
          revision: parsed.currentRevision + 1,
          plaintextSchemaVersion: parsed.plaintextSchemaVersion,
          encryptionAlgorithm: parsed.encryptionAlgorithm,
          encryptionParams: JSON.stringify(parsed.encryptionParams),
          ciphertext: parsed.ciphertext,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(keyRing.userId, session.user.id),
            eq(keyRing.revision, parsed.currentRevision),
          ),
        )
        .returning(),
      assertExists(db, (q) =>
        q
          .from(keyRing)
          .where(
            and(
              eq(keyRing.userId, session.user.id),
              eq(keyRing.revision, parsed.currentRevision + 1),
              eq(keyRing.activeDekId, parsed.activeDekId),
            ),
          ),
      ),
      db
        .select()
        .from(keyRingWrapping)
        .where(
          and(
            eq(keyRingWrapping.userId, session.user.id),
            eq(keyRingWrapping.method, 'password'),
            eq(keyRingWrapping.status, 'active'),
            isNull(keyRingWrapping.revokedAt),
          ),
        )
        .limit(1),
    ]);

    if (!keyRingRow || !wrapping) {
      return c.json({ code: 'encryption_key_not_found' }, 404);
    }
    return c.json(serializeRecord(keyRingRow, wrapping));
  } catch {
    return c.json({ code: 'key_ring_revision_conflict' }, 409);
  }
});

e2eeRouter.post('/key-ring/change-password', async (c) => {
  const session = c.get('session');

  if (c.req.header('Content-Type') !== 'application/json') {
    return c.json({ code: 'unsupported_content_type' }, 415);
  }

  const body: unknown = await c.req.json().catch(() => null);
  const parsed = parseChangePasswordBody(body);
  if (parsed instanceof Response) return parsed;

  const db = getDb(c.env.DB);
  try {
    await db.batch([
      assertExists(db, (q) =>
        q
          .from(keyRingWrapping)
          .where(
            and(
              eq(keyRingWrapping.id, parsed.currentWrappingId),
              eq(keyRingWrapping.userId, session.user.id),
              eq(keyRingWrapping.method, 'password'),
              eq(keyRingWrapping.status, 'active'),
            ),
          ),
      ),
      db
        .update(keyRingWrapping)
        .set({ status: 'revoked', revokedAt: new Date() })
        .where(
          and(
            eq(keyRingWrapping.id, parsed.currentWrappingId),
            eq(keyRingWrapping.userId, session.user.id),
            eq(keyRingWrapping.method, 'password'),
            eq(keyRingWrapping.status, 'active'),
          ),
        ),
      db.insert(keyRingWrapping).values({
        id: parsed.wrappingId,
        userId: session.user.id,
        method: 'password',
        status: 'active',
        kdfAlgorithm: 'argon2id',
        kdfParams: JSON.stringify(KDF_PARAMS_V1),
        kdfSalt: parsed.kdfSalt,
        wrappingAlgorithm: 'aes-256-gcm',
        wrappingParams: JSON.stringify(parsed.wrappingParams),
        ciphertext: parsed.wrappedMek,
      }),
    ]);
  } catch {
    return c.json({ code: 'password_wrapper_conflict' }, 409);
  }

  return c.body(null, 204);
});

function parseCreateBody(body: unknown) {
  if (!body || typeof body !== 'object') {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  const value = body as Record<string, unknown>;

  const keyRingBlock = value.keyRing as Record<string, unknown> | null;
  if (!keyRingBlock || typeof keyRingBlock !== 'object') {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  if (
    typeof keyRingBlock.id !== 'string' ||
    typeof keyRingBlock.activeDekId !== 'string' ||
    !isSafeId(keyRingBlock.id) ||
    !isSafeId(keyRingBlock.activeDekId)
  ) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  if (keyRingBlock.plaintextSchemaVersion !== 1) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  if (keyRingBlock.encryptionAlgorithm !== 'aes-256-gcm') {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  const encryptionParams = parseAesGcmParams(keyRingBlock.encryptionParams);
  if (!encryptionParams) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  if (typeof keyRingBlock.ciphertext !== 'string') {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  const mekBlock = value.mek as Record<string, unknown> | null;
  if (!mekBlock || typeof mekBlock !== 'object') {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  if (typeof mekBlock.id !== 'string' || !isSafeId(mekBlock.id)) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  if (
    mekBlock.kdfAlgorithm !== 'argon2id' ||
    !sameJson(mekBlock.kdfParams, KDF_PARAMS_V1) ||
    mekBlock.wrappingAlgorithm !== 'aes-256-gcm'
  ) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  const wrappingParams = parseAesGcmParams(mekBlock.wrappingParams);
  if (!wrappingParams) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  if (
    typeof mekBlock.kdfSalt !== 'string' ||
    typeof mekBlock.ciphertext !== 'string'
  ) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  if (
    keyRingBlock.ciphertext.length > MAX_KEY_RING_CIPHERTEXT_BASE64_LENGTH ||
    mekBlock.kdfSalt.length > KDF_SALT_BASE64_LENGTH ||
    mekBlock.ciphertext.length > WRAPPED_MEK_CIPHERTEXT_BASE64_LENGTH
  ) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  let keyRingCiphertext: Uint8Array;
  let kdfSalt: Uint8Array;
  let wrappedMek: Uint8Array;
  try {
    keyRingCiphertext = Uint8Array.fromBase64(keyRingBlock.ciphertext);
    kdfSalt = Uint8Array.fromBase64(mekBlock.kdfSalt);
    wrappedMek = Uint8Array.fromBase64(mekBlock.ciphertext);
  } catch {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  if (
    keyRingCiphertext.byteLength > MAX_KEY_RING_CIPHERTEXT_BYTES ||
    kdfSalt.byteLength !== KDF_SALT_BYTES ||
    !isSafeCiphertext(wrappedMek)
  ) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  return {
    keyRingId: keyRingBlock.id,
    wrappingId: mekBlock.id,
    activeDekId: keyRingBlock.activeDekId,
    plaintextSchemaVersion: 1 as const,
    encryptionParams,
    wrappingParams,
    kdfSalt,
    wrappedMek,
    keyRingCiphertext,
  };
}

function parseChangePasswordBody(body: unknown) {
  if (!body || typeof body !== 'object') {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  const value = body as Record<string, unknown>;
  if (
    typeof value.currentWrappingId !== 'string' ||
    typeof value.wrappingId !== 'string' ||
    value.kdfAlgorithm !== 'argon2id' ||
    !sameJson(value.kdfParams, KDF_PARAMS_V1) ||
    value.wrappingAlgorithm !== 'aes-256-gcm'
  ) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  if (!isSafeId(value.currentWrappingId) || !isSafeId(value.wrappingId)) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  const wrappingParams = parseAesGcmParams(value.wrappingParams);
  if (!wrappingParams) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  if (
    typeof value.kdfSalt !== 'string' ||
    typeof value.ciphertext !== 'string'
  ) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  if (
    value.kdfSalt.length > KDF_SALT_BASE64_LENGTH ||
    value.ciphertext.length > WRAPPED_MEK_CIPHERTEXT_BASE64_LENGTH
  ) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  let kdfSalt: Uint8Array;
  let wrappedMek: Uint8Array;
  try {
    kdfSalt = Uint8Array.fromBase64(value.kdfSalt);
    wrappedMek = Uint8Array.fromBase64(value.ciphertext);
  } catch {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  if (kdfSalt.byteLength !== KDF_SALT_BYTES || !isSafeCiphertext(wrappedMek)) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  return {
    currentWrappingId: value.currentWrappingId,
    wrappingId: value.wrappingId,
    wrappingParams,
    kdfSalt,
    wrappedMek,
  };
}

function parseUpdateBody(body: unknown) {
  if (!body || typeof body !== 'object') {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  const value = body as Record<string, unknown>;
  if (
    !Number.isInteger(value.currentRevision) ||
    (value.currentRevision as number) < 1 ||
    typeof value.activeDekId !== 'string' ||
    value.plaintextSchemaVersion !== 1 ||
    value.encryptionAlgorithm !== 'aes-256-gcm'
  ) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  if (!isSafeId(value.activeDekId)) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  const encryptionParams = parseAesGcmParams(value.encryptionParams);
  if (!encryptionParams) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  if (typeof value.ciphertext !== 'string') {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  if (value.ciphertext.length > MAX_KEY_RING_CIPHERTEXT_BASE64_LENGTH) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  let ciphertext: Uint8Array;
  try {
    ciphertext = Uint8Array.fromBase64(value.ciphertext);
  } catch {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  if (ciphertext.byteLength > MAX_KEY_RING_CIPHERTEXT_BYTES) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  return {
    currentRevision: value.currentRevision as number,
    activeDekId: value.activeDekId,
    plaintextSchemaVersion: 1 as const,
    encryptionAlgorithm: value.encryptionAlgorithm,
    encryptionParams,
    ciphertext,
  };
}

function parseAesGcmParams(
  value: unknown,
): { iv: string; tagBits: number } | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.iv !== 'string' || !obj.iv) return null;
  if (obj.iv.length > AES_GCM_IV_BASE64_LENGTH) return null;
  if (typeof obj.tagBits !== 'number') return null;
  try {
    const bytes = Uint8Array.fromBase64(obj.iv);
    if (bytes.byteLength !== AES_GCM_IV_BYTES) return null;
  } catch {
    return null;
  }
  return { iv: obj.iv, tagBits: obj.tagBits };
}

function serializeRecord(keyRingRow: KeyRingRow, wrapping: KeyRingWrappingRow) {
  const encryptionParams = JSON.parse(keyRingRow.encryptionParams) as {
    iv: string;
    tagBits: number;
  };
  const wrappingParams = JSON.parse(wrapping.wrappingParams) as {
    iv: string;
    tagBits: number;
  };

  return {
    keyRing: {
      id: keyRingRow.id,
      userId: keyRingRow.userId,
      activeDekId: keyRingRow.activeDekId,
      revision: keyRingRow.revision,
      plaintextSchemaVersion: keyRingRow.plaintextSchemaVersion,
      encryptionAlgorithm: keyRingRow.encryptionAlgorithm,
      encryptionParams,
      ciphertext: keyRingRow.ciphertext?.toBase64(),
      createdAt: serializeTimestamp(keyRingRow.createdAt),
      updatedAt: serializeTimestamp(keyRingRow.updatedAt),
    },
    wrappers: [
      {
        id: wrapping.id,
        userId: wrapping.userId,
        method: wrapping.method,
        kdfAlgorithm: wrapping.kdfAlgorithm,
        kdfParams: JSON.parse(wrapping.kdfParams) as unknown,
        kdfSalt: wrapping.kdfSalt.toBase64(),
        wrappingAlgorithm: wrapping.wrappingAlgorithm,
        wrappingParams,
        ciphertext: wrapping.ciphertext.toBase64(),
        createdAt: serializeTimestamp(wrapping.createdAt),
      },
    ],
  };
}

function sameJson(value: unknown, expected: object): boolean {
  return JSON.stringify(value) === JSON.stringify(expected);
}

function isSafeId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isSafeCiphertext(value: Uint8Array): boolean {
  return value.byteLength === WRAPPED_MEK_CIPHERTEXT_BYTES;
}

function serializeTimestamp(value: Date): string {
  return value.toISOString();
}
