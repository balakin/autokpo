import { and, eq, exists, gt, gte, lte, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import {
  MAX_SYNC_BODY_BYTES,
  MAX_SYNC_CIPHERTEXT_BYTES,
  maxBase64Length,
} from '../constants';
import type { WorkerHonoEnv } from '../context';
import { getDb } from '../db';
import { assertCondition, assertExists } from '../db/assert';
import { keyRing, syncRecord } from '../db/schema';
import { requireAuth } from '../middlewares/auth';
import { payloadLimit } from '../middlewares/payload-limit';
import { rateLimitRouteGroup } from '../middlewares/rate-limit';

const SOFT_CAP_ROWS = 200;
const SOFT_CAP_BYTES = 2 * 1024 * 1024;
const HARD_CAP_BYTES = 4 * 1024 * 1024;
const MAX_SYNC_CIPHERTEXT_BASE64_LENGTH = maxBase64Length(
  MAX_SYNC_CIPHERTEXT_BYTES,
);
const uuidSchema = z.uuid();

const encEnvelopeSchema = z.object({
  id: uuidSchema,
  encryptionKeyId: uuidSchema,
  keyRingRevision: z.number().int().positive(),
  encryptionAlgorithm: z.literal('aes-256-gcm'),
  encryptionParams: z.object({
    iv: z.string().min(1),
    tagBits: z.number().int(),
  }),
  ciphertext: z.string().min(1),
});

const pushBodySchema = encEnvelopeSchema;
const compactBodySchema = encEnvelopeSchema;

const router = new Hono<WorkerHonoEnv>();

router.use(
  '*',
  payloadLimit(MAX_SYNC_BODY_BYTES),
  requireAuth,
  rateLimitRouteGroup('sync'),
);

function codeResponse(code: string, status: number): Response {
  return Response.json({ code }, { status });
}

function getLocalUserId(c: {
  req: { header(name: string): string | undefined };
}): string | Response {
  const localUserId = c.req.header('X-Local-User-Id');
  if (!localUserId) {
    return codeResponse('missing_local_user_id', 400);
  }
  return localUserId;
}

router.get('/', async (c) => {
  const session = c.get('session');
  const localUserId = getLocalUserId(c);
  if (localUserId instanceof Response) return localUserId;
  if (localUserId !== session.user.id) {
    return codeResponse('local_user_mismatch', 409);
  }
  const userId = session.user.id;
  const db = getDb(c.env.DB);

  const ifNoneMatch = c.req.header('If-None-Match');
  const since =
    ifNoneMatch !== undefined
      ? parseInt(ifNoneMatch.replace(/^"|"$/g, ''), 10)
      : 0;

  if (ifNoneMatch !== undefined && (Number.isNaN(since) || since < 0)) {
    return c.json({ error: 'Invalid If-None-Match header' }, 400);
  }

  const freshPullFloor = sql<number>`COALESCE(
    (SELECT MAX(${syncRecord.seq}) FROM ${syncRecord} WHERE ${syncRecord.userId} = ${userId} AND ${syncRecord.kind} = 'snapshot'),
    (SELECT MIN(${syncRecord.seq}) FROM ${syncRecord} WHERE ${syncRecord.userId} = ${userId}),
    1
  )`;

  const [[keyRingRow], [meta], items] = await db.batch([
    db.select().from(keyRing).where(eq(keyRing.userId, userId)).limit(1),
    db
      .select({
        head: sql<number>`COALESCE(MAX(${syncRecord.seq}), 0)`,
        latestSnapshotSeq: sql<number>`COALESCE(MAX(CASE WHEN ${syncRecord.kind} = 'snapshot' THEN ${syncRecord.seq} END), 0)`,
      })
      .from(syncRecord)
      .where(eq(syncRecord.userId, userId)),
    db
      .select({
        id: syncRecord.id,
        seq: syncRecord.seq,
        kind: syncRecord.kind,
        encryptionKeyId: syncRecord.encryptionKeyId,
        keyRingRevision: syncRecord.keyRingRevision,
        encryptionAlgorithm: syncRecord.encryptionAlgorithm,
        encryptionParams: syncRecord.encryptionParams,
        ciphertext: syncRecord.ciphertext,
      })
      .from(syncRecord)
      .where(
        and(
          eq(syncRecord.userId, userId),
          since === 0
            ? gte(syncRecord.seq, freshPullFloor)
            : gt(syncRecord.seq, since),
        ),
      )
      .orderBy(syncRecord.seq),
  ]);

  if (!keyRingRow) return codeResponse('encryption_key_not_found', 404);

  if (
    since > 0 &&
    meta.latestSnapshotSeq > 0 &&
    since < meta.latestSnapshotSeq
  ) {
    return c.json({ error: 'Cursor is stale; refetch from scratch' }, 410);
  }
  if (since > meta.head) {
    return c.json({ error: 'Cursor is too new; refetch from scratch' }, 410);
  }

  const head = meta.head;
  const etag = `"${head}"`;
  if (ifNoneMatch !== undefined && since === head) {
    return c.body(null, 304, { ETag: etag });
  }

  const records = items.map((row) => ({
    id: row.id,
    seq: row.seq,
    kind: row.kind,
    encryptionKeyId: row.encryptionKeyId,
    keyRingRevision: row.keyRingRevision,
    encryptionAlgorithm: row.encryptionAlgorithm,
    encryptionParams: JSON.parse(row.encryptionParams) as {
      iv: string;
      tagBits: number;
    },
    ciphertext: row.ciphertext.toBase64(),
  }));

  return c.json({ records }, 200, { ETag: etag });
});

router.post('/', async (c) => {
  const session = c.get('session');
  const localUserId = getLocalUserId(c);
  if (localUserId instanceof Response) return localUserId;
  if (localUserId !== session.user.id) {
    return codeResponse('local_user_mismatch', 409);
  }
  const userId = session.user.id;

  const rawBody: unknown = await c.req.json().catch(() => null);
  const parsed = pushBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return c.json(
      { error: 'Invalid request body', details: parsed.error.issues },
      400,
    );
  }
  const {
    id,
    encryptionKeyId,
    keyRingRevision,
    encryptionAlgorithm,
    encryptionParams,
    ciphertext: ciphertextBase64,
  } = parsed.data;

  let ivBytes: Uint8Array;
  let ciphertextBytes: Uint8Array;
  if (ciphertextBase64.length > MAX_SYNC_CIPHERTEXT_BASE64_LENGTH) {
    return c.json({ error: 'Payload too large' }, 413);
  }
  try {
    ivBytes = Uint8Array.fromBase64(encryptionParams.iv);
    ciphertextBytes = Uint8Array.fromBase64(ciphertextBase64);
  } catch {
    return c.json({ error: 'Invalid base64 encoding' }, 400);
  }

  if (ivBytes.byteLength !== 12) {
    return c.json({ error: 'IV must be 12 bytes' }, 400);
  }
  if (ciphertextBytes.byteLength > MAX_SYNC_CIPHERTEXT_BYTES) {
    return c.json({ error: 'Payload too large' }, 413);
  }

  const db = getDb(c.env.DB);

  try {
    const [, [row]] = await db.batch([
      // guard: abort if encryptionKeyId doesn't match the user's active DEK
      assertExists(db, (q) =>
        q
          .from(keyRing)
          .where(
            and(
              eq(keyRing.userId, userId),
              eq(keyRing.activeDekId, encryptionKeyId),
              eq(keyRing.revision, keyRingRevision),
            ),
          ),
      ),
      // atomically assign the next seq and insert the record;
      // HAVING aborts the insert (returns no rows) when the hard storage cap would be exceeded
      db
        .insert(syncRecord)
        .select(
          db
            .select({
              id: sql`${id}`.as('id'),
              userId: sql`${userId}`.as('user_id'),
              seq: sql`COALESCE(MAX(${syncRecord.seq}), 0) + 1`.as('seq'),
              encryptionAlgorithm: sql`${encryptionAlgorithm}`.as(
                'encryption_algorithm',
              ),
              encryptionParams: sql`${JSON.stringify(encryptionParams)}`.as(
                'encryption_params',
              ),
              keyRingRevision: sql`${keyRingRevision}`.as('key_ring_revision'),
              ciphertext: sql`${ciphertextBytes}`.as('ciphertext'),
              kind: sql`'update'`.as('kind'),
              encryptionKeyId: sql`${encryptionKeyId}`.as('encryption_key_id'),
              created: sql`(cast(unixepoch('subsecond') * 1000 as integer))`.as(
                'created',
              ),
            })
            .from(syncRecord)
            .where(eq(syncRecord.userId, userId))
            .having(
              sql`COALESCE(SUM(LENGTH(${syncRecord.ciphertext})), 0) + ${ciphertextBytes.byteLength} <= ${HARD_CAP_BYTES}`,
            ),
        )
        // return post-insert stats to decide whether to hint the client to compact
        .returning({
          seq: syncRecord.seq,
          rowCount:
            sql<number>`(SELECT COUNT(*) FROM ${syncRecord} WHERE ${syncRecord.userId} = ${userId})`.as(
              'rowCount',
            ),
          totalBytes:
            sql<number>`(SELECT COALESCE(SUM(LENGTH(${syncRecord.ciphertext})), 0) FROM ${syncRecord} WHERE ${syncRecord.userId} = ${userId})`.as(
              'totalBytes',
            ),
        }),
    ]);

    if (row) {
      const compactHint =
        row.rowCount >= SOFT_CAP_ROWS || row.totalBytes >= SOFT_CAP_BYTES;
      const headers: Record<string, string> = { ETag: `"${row.seq}"` };
      if (compactHint) headers['X-Compact-Hint'] = 'please';
      return c.body(null, 200, headers);
    }
  } catch {
    const [existing] = await db
      .select({
        existingSeq: syncRecord.seq,
        existingEncryptionParams: syncRecord.encryptionParams,
        existingCiphertext: syncRecord.ciphertext,
      })
      .from(syncRecord)
      .where(and(eq(syncRecord.userId, userId), eq(syncRecord.id, id)));

    if (existing) {
      const existingParams = JSON.parse(existing.existingEncryptionParams) as {
        iv: string;
        tagBits: number;
      };
      if (
        existingParams.iv === encryptionParams.iv &&
        existingParams.tagBits === encryptionParams.tagBits &&
        existing.existingCiphertext.byteLength === ciphertextBytes.byteLength &&
        new Uint8Array(existing.existingCiphertext).every(
          (v, i) => v === ciphertextBytes[i],
        )
      ) {
        return c.body(null, 200, { ETag: `"${existing.existingSeq}"` });
      }
      return codeResponse('idempotency_conflict', 409);
    }

    return codeResponse('write_conflict', 409);
  }

  return c.json({ error: 'Storage limit exceeded' }, 413);
});

router.post('/compact', async (c) => {
  const session = c.get('session');
  const localUserId = getLocalUserId(c);
  if (localUserId instanceof Response) return localUserId;
  if (localUserId !== session.user.id) {
    return codeResponse('local_user_mismatch', 409);
  }
  const userId = session.user.id;

  const replacesUpToStr = c.req.header('X-Replaces-Up-To');
  if (!replacesUpToStr) {
    return c.json({ code: 'missing_required_headers' }, 400);
  }

  const replacesUpTo = parseInt(replacesUpToStr, 10);
  if (Number.isNaN(replacesUpTo)) {
    return c.json({ error: 'Invalid X-Replaces-Up-To header' }, 400);
  }

  const rawBody: unknown = await c.req.json().catch(() => null);
  const parsed = compactBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return c.json(
      { error: 'Invalid request body', details: parsed.error.issues },
      400,
    );
  }
  const {
    id,
    encryptionKeyId,
    keyRingRevision,
    encryptionAlgorithm,
    encryptionParams,
    ciphertext: ciphertextBase64,
  } = parsed.data;

  let ivBytes: Uint8Array;
  let snapshotCiphertext: Uint8Array;
  if (ciphertextBase64.length > MAX_SYNC_CIPHERTEXT_BASE64_LENGTH) {
    return c.json({ error: 'Payload too large' }, 413);
  }
  try {
    ivBytes = Uint8Array.fromBase64(encryptionParams.iv);
    snapshotCiphertext = Uint8Array.fromBase64(ciphertextBase64);
  } catch {
    return c.json({ error: 'Invalid base64 encoding' }, 400);
  }

  if (ivBytes.byteLength !== 12) {
    return c.json({ error: 'IV must be 12 bytes' }, 400);
  }
  if (snapshotCiphertext.byteLength > MAX_SYNC_CIPHERTEXT_BYTES) {
    return c.json({ error: 'Payload too large' }, 413);
  }

  const db = getDb(c.env.DB);

  const insertResult = await insertCompactSnapshot(db, userId, replacesUpTo, {
    id,
    encryptionKeyId,
    keyRingRevision,
    encryptionAlgorithm,
    encryptionParams,
    ciphertext: snapshotCiphertext,
  });
  if (insertResult instanceof Response) return insertResult;

  if (replacesUpTo > 0) {
    await db
      .delete(syncRecord)
      .where(
        and(
          eq(syncRecord.userId, userId),
          sql`${syncRecord.seq} <= ${replacesUpTo}`,
        ),
      );
  }

  const { nextSeq } = insertResult;
  const headers: Record<string, string> = { ETag: `"${nextSeq}"` };
  return c.body(null, 200, headers);
});

export { router as syncRouter };

type SnapshotPayload = {
  id: string;
  encryptionKeyId: string;
  keyRingRevision: number;
  encryptionAlgorithm: string;
  encryptionParams: { iv: string; tagBits: number };
  ciphertext: Uint8Array;
};

type InsertCompactSnapshotResult = {
  nextSeq: number;
};

async function insertCompactSnapshot(
  db: ReturnType<typeof getDb>,
  userId: string,
  replacesUpTo: number,
  {
    id,
    encryptionKeyId,
    keyRingRevision,
    encryptionAlgorithm,
    encryptionParams,
    ciphertext,
  }: SnapshotPayload,
): Promise<Response | InsertCompactSnapshotResult> {
  try {
    const [, , , [insertResult]] = await db.batch([
      // guard: abort if encryptionKeyId doesn't match the user's active DEK
      assertExists(db, (q) =>
        q
          .from(keyRing)
          .where(
            and(
              eq(keyRing.userId, userId),
              eq(keyRing.activeDekId, encryptionKeyId),
              eq(keyRing.revision, keyRingRevision),
            ),
          ),
      ),
      // guard: abort if replacesUpTo exceeds the current head
      assertCondition(
        db,
        exists(
          db
            .select({ head: sql<number>`COALESCE(MAX(${syncRecord.seq}), 0)` })
            .from(syncRecord)
            .where(eq(syncRecord.userId, userId))
            .having(
              gte(sql`COALESCE(MAX(${syncRecord.seq}), 0)`, replacesUpTo),
            ),
        ),
      ),
      // guard: abort if the snapshot would exceed the storage cap after compaction;
      // only count records that survive (seq > replacesUpTo), since the rest will be deleted
      assertCondition(
        db,
        exists(
          db
            .select({
              total: sql<number>`COALESCE(SUM(LENGTH(${syncRecord.ciphertext})), 0) + ${ciphertext.byteLength}`,
            })
            .from(syncRecord)
            .where(
              and(
                eq(syncRecord.userId, userId),
                gt(syncRecord.seq, replacesUpTo),
              ),
            )
            .having(
              lte(
                sql`COALESCE(SUM(LENGTH(${syncRecord.ciphertext})), 0) + ${ciphertext.byteLength}`,
                HARD_CAP_BYTES,
              ),
            ),
        ),
      ),
      // insert the snapshot; throws on duplicate id so the catch can handle idempotency
      db
        .insert(syncRecord)
        .values({
          id,
          userId,
          seq: sql`(select coalesce(max(${syncRecord.seq}), 0) + 1 from ${syncRecord} where ${syncRecord.userId} = ${userId})`,
          encryptionAlgorithm,
          encryptionParams: JSON.stringify(encryptionParams),
          keyRingRevision,
          ciphertext,
          kind: 'snapshot',
          encryptionKeyId,
        })
        .returning({ seq: syncRecord.seq }),
    ]);

    return { nextSeq: insertResult.seq };
  } catch {
    const [existing] = await db
      .select({
        seq: syncRecord.seq,
        encryptionParams: syncRecord.encryptionParams,
        ciphertext: syncRecord.ciphertext,
      })
      .from(syncRecord)
      .where(and(eq(syncRecord.userId, userId), eq(syncRecord.id, id)));

    if (existing) {
      const existingParams = JSON.parse(existing.encryptionParams) as {
        iv: string;
        tagBits: number;
      };
      if (
        existingParams.iv === encryptionParams.iv &&
        existingParams.tagBits === encryptionParams.tagBits &&
        existing.ciphertext.byteLength === ciphertext.byteLength &&
        new Uint8Array(existing.ciphertext).every((v, i) => v === ciphertext[i])
      ) {
        return new Response(null, {
          status: 200,
          headers: { ETag: `"${existing.seq}"` },
        });
      }
      return codeResponse('idempotency_conflict', 409);
    }

    return codeResponse('write_conflict', 409);
  }
}
