import { and, eq, isNull } from 'drizzle-orm';
import { Hono } from 'hono';

import { requireSession } from '../auth';
import { getDb } from '../db';
import {
  userEncryptionKey,
  userEncryptionKeyWrapping,
  type UserEncryptionKeyRow,
  type UserEncryptionKeyWrappingRow,
} from '../db/schema';

const KDF_PARAMS_V1 = {
  memorySize: 65536,
  iterations: 3,
  parallelism: 1,
  hashLength: 32,
} as const;

const WRAP_PARAMS_V1 = {
  ivBytes: 12,
  tagBits: 128,
} as const;

const KDF_SALT_BYTES = 16;
const WRAP_IV_BYTES = 12;
const WRAPPED_MASTER_KEY_BYTES = 48;

export const e2eeRouter = new Hono<{ Bindings: Env }>();

e2eeRouter.get('/key', async (c) => {
  const session = await requireSession(c);
  if (session instanceof Response) return session;

  const record = await getActivePasswordWrapping(c.env.DB, session.user.id);
  if (!record) return c.json({ code: 'encryption_key_not_found' }, 404);

  return c.json(serializeRecord(record.key, record.wrapping));
});

e2eeRouter.post('/key', async (c) => {
  const session = await requireSession(c);
  if (session instanceof Response) return session;

  if (c.req.header('Content-Type') !== 'application/json') {
    return c.json({ code: 'unsupported_content_type' }, 415);
  }

  const body: unknown = await c.req.json().catch(() => null);
  const parsed = parseCreateBody(body);
  if (parsed instanceof Response) return parsed;

  const db = getDb(c.env.DB);
  const [existing] = await db
    .select({ id: userEncryptionKey.id })
    .from(userEncryptionKey)
    .where(
      and(
        eq(userEncryptionKey.userId, session.user.id),
        isNull(userEncryptionKey.revokedAt),
      ),
    )
    .limit(1);

  if (existing) {
    return c.json({ code: 'encryption_key_already_exists' }, 409);
  }

  await db.batch([
    db.insert(userEncryptionKey).values({
      id: parsed.keyId,
      userId: session.user.id,
    }),
    db.insert(userEncryptionKeyWrapping).values({
      id: parsed.wrappingId,
      keyId: parsed.keyId,
      userId: session.user.id,
      method: 'password',
      kdfVersion: 1,
      kdfAlgorithm: 'argon2id',
      kdfParamsJson: JSON.stringify(KDF_PARAMS_V1),
      kdfSalt: parsed.kdfSalt,
      wrapVersion: 1,
      wrapAlgorithm: 'aes-256-gcm',
      wrapParamsJson: JSON.stringify(WRAP_PARAMS_V1),
      wrapIv: parsed.wrapIv,
      wrappedMasterKey: parsed.wrappedMasterKey,
    }),
  ]);

  const record = await getActivePasswordWrapping(c.env.DB, session.user.id);
  if (!record) return c.json({ code: 'encryption_key_not_found' }, 500);
  return c.json(serializeRecord(record.key, record.wrapping), 201);
});

async function getActivePasswordWrapping(
  dbBinding: D1Database,
  userId: string,
) {
  const db = getDb(dbBinding);
  const [key] = await db
    .select()
    .from(userEncryptionKey)
    .where(
      and(
        eq(userEncryptionKey.userId, userId),
        isNull(userEncryptionKey.revokedAt),
      ),
    )
    .limit(1);
  if (!key) return null;

  const [wrapping] = await db
    .select()
    .from(userEncryptionKeyWrapping)
    .where(
      and(
        eq(userEncryptionKeyWrapping.userId, userId),
        eq(userEncryptionKeyWrapping.keyId, key.id),
        eq(userEncryptionKeyWrapping.method, 'password'),
        isNull(userEncryptionKeyWrapping.revokedAt),
      ),
    )
    .limit(1);
  if (!wrapping) return null;
  return { key, wrapping };
}

function parseCreateBody(body: unknown) {
  if (!body || typeof body !== 'object') {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  const value = body as Record<string, unknown>;
  if (
    typeof value.keyId !== 'string' ||
    typeof value.wrappingId !== 'string' ||
    value.kdfVersion !== 1 ||
    value.kdfAlgorithm !== 'argon2id' ||
    !sameJson(value.kdfParams, KDF_PARAMS_V1) ||
    value.wrapVersion !== 1 ||
    value.wrapAlgorithm !== 'aes-256-gcm' ||
    !sameJson(value.wrapParams, WRAP_PARAMS_V1)
  ) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }
  if (!isSafeId(value.keyId) || !isSafeId(value.wrappingId)) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  if (
    typeof value.kdfSalt !== 'string' ||
    typeof value.wrapIv !== 'string' ||
    typeof value.wrappedMasterKey !== 'string'
  ) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  let kdfSalt: Uint8Array;
  let wrapIv: Uint8Array;
  let wrappedMasterKey: Uint8Array;
  try {
    kdfSalt = Uint8Array.fromBase64(value.kdfSalt);
    wrapIv = Uint8Array.fromBase64(value.wrapIv);
    wrappedMasterKey = Uint8Array.fromBase64(value.wrappedMasterKey);
  } catch {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  if (
    kdfSalt.byteLength !== KDF_SALT_BYTES ||
    wrapIv.byteLength !== WRAP_IV_BYTES ||
    wrappedMasterKey.byteLength !== WRAPPED_MASTER_KEY_BYTES
  ) {
    return Response.json({ code: 'invalid_payload' }, { status: 400 });
  }

  return {
    keyId: value.keyId,
    wrappingId: value.wrappingId,
    kdfSalt,
    wrapIv,
    wrappedMasterKey,
  };
}

function serializeRecord(
  key: UserEncryptionKeyRow,
  wrapping: UserEncryptionKeyWrappingRow,
) {
  return {
    version: 1,
    key: {
      id: key.id,
      userId: key.userId,
      createdAt: serializeTimestamp(key.createdAt),
      revokedAt: serializeNullableTimestamp(key.revokedAt),
    },
    wrapping: {
      id: wrapping.id,
      keyId: wrapping.keyId,
      userId: wrapping.userId,
      method: wrapping.method,
      kdfVersion: wrapping.kdfVersion,
      kdfAlgorithm: wrapping.kdfAlgorithm,
      kdfParams: JSON.parse(wrapping.kdfParamsJson) as unknown,
      kdfSalt: wrapping.kdfSalt.toBase64(),
      wrapVersion: wrapping.wrapVersion,
      wrapAlgorithm: wrapping.wrapAlgorithm,
      wrapParams: JSON.parse(wrapping.wrapParamsJson) as unknown,
      wrapIv: wrapping.wrapIv.toBase64(),
      wrappedMasterKey: wrapping.wrappedMasterKey.toBase64(),
      createdAt: serializeTimestamp(wrapping.createdAt),
      revokedAt: serializeNullableTimestamp(wrapping.revokedAt),
    },
  };
}

function sameJson(value: unknown, expected: object): boolean {
  return JSON.stringify(value) === JSON.stringify(expected);
}

function isSafeId(value: string): boolean {
  return /^[\w-]{8,80}$/.test(value);
}

function serializeTimestamp(value: Date): string {
  return value.toISOString();
}

function serializeNullableTimestamp(value: Date | null): string | null {
  return value ? serializeTimestamp(value) : null;
}
