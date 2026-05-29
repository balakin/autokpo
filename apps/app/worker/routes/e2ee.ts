import { and, eq, isNull } from 'drizzle-orm';
import { Hono } from 'hono';

import { requireSession } from '../auth';
import { getDb } from '../db';
import { assertExists } from '../db/assert';
import {
  keyRing,
  keyRingWrapping,
  type KeyRingRow,
  type KeyRingWrappingRow,
} from '../db/schema';

const KDF_PARAMS_V1 = {
  memorySize: 65536,
  iterations: 3,
  parallelism: 1,
  hashLength: 32,
} as const;

const KDF_SALT_BYTES = 16;
const IV_BYTES = 12;
const CIPHERTEXT_BYTES = 48;
const MAX_KEY_RING_CIPHERTEXT_BYTES = 64 * 1024;

export const e2eeRouter = new Hono<{ Bindings: Env }>();

e2eeRouter.get('/key-ring', async (c) => {
  const session = await requireSession(c);
  if (session instanceof Response) return session;

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
  const session = await requireSession(c);
  if (session instanceof Response) return session;

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
  const session = await requireSession(c);
  if (session instanceof Response) return session;

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
          encryptionAlgorithm: parsed.encryptionAlgorithm,
          encryptionParams: JSON.stringify(parsed.encryptionParams),
          ciphertext: parsed.keyRingCiphertext,
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
  const session = await requireSession(c);
  if (session instanceof Response) return session;

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
  if (
    typeof value.keyRingId !== 'string' ||
    typeof value.wrappingId !== 'string' ||
    typeof value.activeDekId !== 'string' ||
    value.encryptionAlgorithm !== 'aes-256-gcm' ||
    value.kdfAlgorithm !== 'argon2id' ||
    !sameJson(value.kdfParams, KDF_PARAMS_V1) ||
    value.wrappingAlgorithm !== 'aes-256-gcm'
  ) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  if (
    !isSafeId(value.keyRingId) ||
    !isSafeId(value.wrappingId) ||
    !isSafeId(value.activeDekId)
  ) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  const encryptionParams = parseAesGcmParams(value.encryptionParams);
  if (!encryptionParams) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  const wrappingParams = parseAesGcmParams(value.wrappingParams);
  if (!wrappingParams) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  if (
    typeof value.kdfSalt !== 'string' ||
    typeof value.ciphertext !== 'string' ||
    typeof value.keyRingCiphertext !== 'string'
  ) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  let kdfSalt: Uint8Array;
  let wrappedMek: Uint8Array;
  let keyRingCiphertext: Uint8Array;
  try {
    kdfSalt = Uint8Array.fromBase64(value.kdfSalt);
    wrappedMek = Uint8Array.fromBase64(value.ciphertext);
    keyRingCiphertext = Uint8Array.fromBase64(value.keyRingCiphertext);
  } catch {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  if (
    kdfSalt.byteLength !== KDF_SALT_BYTES ||
    !isSafeCiphertext(wrappedMek) ||
    keyRingCiphertext.byteLength > MAX_KEY_RING_CIPHERTEXT_BYTES
  ) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  return {
    keyRingId: value.keyRingId,
    wrappingId: value.wrappingId,
    activeDekId: value.activeDekId,
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

  if (typeof value.keyRingCiphertext !== 'string') {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  let keyRingCiphertext: Uint8Array;
  try {
    keyRingCiphertext = Uint8Array.fromBase64(value.keyRingCiphertext);
  } catch {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  if (keyRingCiphertext.byteLength > MAX_KEY_RING_CIPHERTEXT_BYTES) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  return {
    currentRevision: value.currentRevision as number,
    activeDekId: value.activeDekId,
    encryptionAlgorithm: value.encryptionAlgorithm,
    encryptionParams,
    keyRingCiphertext,
  };
}

function parseAesGcmParams(
  value: unknown,
): { iv: string; tagBits: number } | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.iv !== 'string' || !obj.iv) return null;
  if (typeof obj.tagBits !== 'number') return null;
  try {
    const bytes = Uint8Array.fromBase64(obj.iv);
    if (bytes.byteLength !== IV_BYTES) return null;
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
  return value.byteLength === CIPHERTEXT_BYTES;
}

function serializeTimestamp(value: Date): string {
  return value.toISOString();
}
