import { and, eq, exists, gt, gte, lte, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { requireSession } from '../auth';
import { getDb } from '../db';
import { assertCondition, assertExists } from '../db/assert';
import { keyRing, syncRecord } from '../db/schema';

const MAX_PLAINTEXT_BYTES = 1 * 1024 * 1024;
const MAX_CIPHERTEXT_BYTES = MAX_PLAINTEXT_BYTES + 16; // plaintext + GCM tag only
const SOFT_CAP_ROWS = 200;
const SOFT_CAP_BYTES = 2 * 1024 * 1024;
const HARD_CAP_BYTES = 4 * 1024 * 1024;
const COMPACT_TAIL_MAX_ROWS = 50;
const COMPACT_TAIL_MAX_BYTES = 256 * 1024;

const uuidSchema = z.uuid();

const encEnvelopeSchema = z.object({
  id: uuidSchema,
  encryptionKeyId: uuidSchema,
  encryptionAlgorithm: z.literal('aes-256-gcm'),
  encryptionVersion: z.literal(1),
  iv: z.string().min(1),
  ciphertext: z.string().min(1),
});

const pushBodySchema = encEnvelopeSchema;
const compactBodySchema = encEnvelopeSchema;

const router = new Hono<{ Bindings: Env }>();

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
  const session = await requireSession(c);
  if (session instanceof Response) return session;
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

  const [[keyRingRow], [meta], items] = await db.batch([
    db.select().from(keyRing).where(eq(keyRing.userId, userId)).limit(1),
    db
      .select({
        head: sql<number>`COALESCE(MAX(${syncRecord.seq}), 0)`,
        minSeq: sql<number>`COALESCE(MIN(${syncRecord.seq}), 0)`,
      })
      .from(syncRecord)
      .where(eq(syncRecord.userId, userId)),
    db
      .select({
        id: syncRecord.id,
        seq: syncRecord.seq,
        kind: syncRecord.kind,
        encryptionKeyId: syncRecord.encryptionKeyId,
        encryptionAlgorithm: syncRecord.encryptionAlgorithm,
        encryptionVersion: syncRecord.encryptionVersion,
        iv: syncRecord.iv,
        ciphertext: syncRecord.ciphertext,
      })
      .from(syncRecord)
      .where(and(eq(syncRecord.userId, userId), gt(syncRecord.seq, since)))
      .orderBy(syncRecord.seq),
  ]);

  if (!keyRingRow) return codeResponse('encryption_key_not_found', 404);

  if (since > 0 && meta.minSeq > 0 && since < meta.minSeq) {
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
    encryptionAlgorithm: row.encryptionAlgorithm,
    encryptionVersion: row.encryptionVersion,
    iv: row.iv.toBase64(),
    ciphertext: row.ciphertext.toBase64(),
  }));

  return c.json({ records }, 200, { ETag: etag });
});

router.post('/', async (c) => {
  const session = await requireSession(c);
  if (session instanceof Response) return session;
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
    encryptionAlgorithm,
    encryptionVersion,
    iv: ivBase64,
    ciphertext: ciphertextBase64,
  } = parsed.data;

  let ivBytes: Uint8Array;
  let ciphertextBytes: Uint8Array;
  try {
    ivBytes = Uint8Array.fromBase64(ivBase64);
    ciphertextBytes = Uint8Array.fromBase64(ciphertextBase64);
  } catch {
    return c.json({ error: 'Invalid base64 encoding' }, 400);
  }

  if (ivBytes.byteLength !== 12) {
    return c.json({ error: 'IV must be 12 bytes' }, 400);
  }
  if (ciphertextBytes.byteLength > MAX_CIPHERTEXT_BYTES) {
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
              encryptionVersion: sql`${encryptionVersion}`.as(
                'encryption_version',
              ),
              iv: sql`${ivBytes}`.as('iv'),
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
        existingEncryptionAlgorithm: syncRecord.encryptionAlgorithm,
        existingEncryptionVersion: syncRecord.encryptionVersion,
        existingIv: syncRecord.iv,
        existingCiphertext: syncRecord.ciphertext,
      })
      .from(syncRecord)
      .where(and(eq(syncRecord.userId, userId), eq(syncRecord.id, id)));

    if (existing) {
      if (
        existing.existingEncryptionAlgorithm === encryptionAlgorithm &&
        existing.existingEncryptionVersion === encryptionVersion &&
        existing.existingIv.byteLength === ivBytes.byteLength &&
        new Uint8Array(existing.existingIv).every((v, i) => v === ivBytes[i]) &&
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
  const session = await requireSession(c);
  if (session instanceof Response) return session;
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
    encryptionAlgorithm,
    encryptionVersion,
    iv: ivBase64,
    ciphertext: ciphertextBase64,
  } = parsed.data;

  let ivBytes: Uint8Array;
  let snapshotCiphertext: Uint8Array;
  try {
    ivBytes = Uint8Array.fromBase64(ivBase64);
    snapshotCiphertext = Uint8Array.fromBase64(ciphertextBase64);
  } catch {
    return c.json({ error: 'Invalid base64 encoding' }, 400);
  }

  if (ivBytes.byteLength !== 12) {
    return c.json({ error: 'IV must be 12 bytes' }, 400);
  }
  if (snapshotCiphertext.byteLength > MAX_CIPHERTEXT_BYTES) {
    return c.json({ error: 'Payload too large' }, 413);
  }

  const db = getDb(c.env.DB);

  const insertResult = await insertCompactSnapshot(db, userId, replacesUpTo, {
    id,
    encryptionKeyId,
    encryptionAlgorithm,
    encryptionVersion,
    ivBytes,
    ciphertext: snapshotCiphertext,
  });
  if (insertResult instanceof Response) return insertResult;

  const { nextSeq, meta, tailRows } = insertResult;
  const effectiveCutoff = computeEffectiveCutoff(
    tailRows,
    meta?.head ?? 0,
    replacesUpTo,
  );

  await deleteCompactedRecords(db, userId, effectiveCutoff);

  const headers: Record<string, string> = { ETag: `"${nextSeq}"` };
  return c.body(null, 200, headers);
});

export { router as syncRouter };

type SnapshotPayload = {
  id: string;
  encryptionKeyId: string;
  encryptionAlgorithm: string;
  encryptionVersion: number;
  ivBytes: Uint8Array;
  ciphertext: Uint8Array;
};

type InsertCompactSnapshotResult = {
  nextSeq: number;
  meta: { head: number; rowCount: number; totalBytes: number } | undefined;
  tailRows: Array<{ seq: number; ciphertextSize: number }>;
};

async function insertCompactSnapshot(
  db: ReturnType<typeof getDb>,
  userId: string,
  replacesUpTo: number,
  {
    id,
    encryptionKeyId,
    encryptionAlgorithm,
    encryptionVersion,
    ivBytes,
    ciphertext,
  }: SnapshotPayload,
): Promise<Response | InsertCompactSnapshotResult> {
  try {
    const [, , , [meta], tailRows, [insertResult]] = await db.batch([
      // guard: abort if encryptionKeyId doesn't match the user's active DEK
      assertExists(db, (q) =>
        q
          .from(keyRing)
          .where(
            and(
              eq(keyRing.userId, userId),
              eq(keyRing.activeDekId, encryptionKeyId),
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
      // aggregate stats needed for the compact hint
      db
        .select({
          head: sql<number>`COALESCE(MAX(${syncRecord.seq}), 0)`,
          rowCount: sql<number>`COUNT(*)`,
          totalBytes: sql<number>`COALESCE(SUM(LENGTH(${syncRecord.ciphertext})), 0)`,
        })
        .from(syncRecord)
        .where(eq(syncRecord.userId, userId)),
      // tail rows needed to compute the safe deletion cutoff; only size is needed, not the bytes
      db
        .select({
          seq: syncRecord.seq,
          ciphertextSize: sql<number>`LENGTH(${syncRecord.ciphertext})`,
        })
        .from(syncRecord)
        .where(eq(syncRecord.userId, userId))
        .orderBy(sql`${syncRecord.seq} DESC`)
        .limit(COMPACT_TAIL_MAX_ROWS * 2),
      // insert the snapshot; throws on duplicate id so the catch can handle idempotency
      db
        .insert(syncRecord)
        .values({
          id,
          userId,
          seq: sql`(select coalesce(max(${syncRecord.seq}), 0) + 1 from ${syncRecord} where ${syncRecord.userId} = ${userId})`,
          encryptionAlgorithm,
          encryptionVersion,
          iv: ivBytes,
          ciphertext,
          kind: 'snapshot',
          encryptionKeyId,
        })
        .returning({ seq: syncRecord.seq }),
    ]);

    return { nextSeq: insertResult.seq, meta, tailRows };
  } catch {
    const [existing] = await db
      .select({
        seq: syncRecord.seq,
        encryptionAlgorithm: syncRecord.encryptionAlgorithm,
        encryptionVersion: syncRecord.encryptionVersion,
        iv: syncRecord.iv,
        ciphertext: syncRecord.ciphertext,
      })
      .from(syncRecord)
      .where(and(eq(syncRecord.userId, userId), eq(syncRecord.id, id)));

    if (existing) {
      if (
        existing.encryptionAlgorithm === encryptionAlgorithm &&
        existing.encryptionVersion === encryptionVersion &&
        existing.iv.byteLength === ivBytes.byteLength &&
        new Uint8Array(existing.iv).every((v, i) => v === ivBytes[i]) &&
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

function computeEffectiveCutoff(
  tailRows: Array<{ seq: number; ciphertextSize: number }>,
  head: number,
  replacesUpTo: number,
): number {
  // Walk the tail (newest → oldest) to find the oldest seq we must keep.
  // We preserve a minimum tail so a client that just compacted isn't immediately
  // told to compact again and has enough records to catch up from a stale cursor.
  let keepCutoff = head; // conservative default: keep everything
  let rowsAccum = 0;
  let bytesAccum = 0;
  for (const row of tailRows) {
    if (rowsAccum >= COMPACT_TAIL_MAX_ROWS) break; // tail row budget exhausted
    if (bytesAccum + row.ciphertextSize > COMPACT_TAIL_MAX_BYTES) break; // tail byte budget exhausted
    keepCutoff = row.seq - 1; // this row must be kept, so the cutoff is just before it
    rowsAccum += 1;
    bytesAccum += row.ciphertextSize;
  }
  return Math.min(replacesUpTo, keepCutoff);
}

async function deleteCompactedRecords(
  db: ReturnType<typeof getDb>,
  userId: string,
  effectiveCutoff: number,
): Promise<void> {
  if (effectiveCutoff > 0) {
    await db
      .delete(syncRecord)
      .where(
        and(
          eq(syncRecord.userId, userId),
          sql`${syncRecord.seq} <= ${effectiveCutoff}`,
        ),
      );
  }
}
