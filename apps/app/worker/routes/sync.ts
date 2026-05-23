import { and, eq, gt, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { requireSession } from '../auth';
import { getDb } from '../db';
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
  const keyRingRow = await getActiveKeyRing(db, userId);
  if (!keyRingRow) return codeResponse('encryption_key_not_found', 404);

  const ifNoneMatch = c.req.header('If-None-Match');
  const since =
    ifNoneMatch !== undefined
      ? parseInt(ifNoneMatch.replace(/^"|"$/g, ''), 10)
      : 0;

  if (ifNoneMatch !== undefined && (Number.isNaN(since) || since < 0)) {
    return c.json({ error: 'Invalid If-None-Match header' }, 400);
  }

  const [[meta], items] = await db.batch([
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
  const db = getDb(c.env.DB);
  const keyRingRow = await getActiveKeyRing(db, userId);
  if (!keyRingRow) return codeResponse('encryption_key_not_found', 404);

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
  if (encryptionKeyId !== keyRingRow.activeDekId) {
    return codeResponse('encryption_key_mismatch', 409);
  }
  if (ciphertextBytes.byteLength > MAX_CIPHERTEXT_BYTES) {
    return c.json({ error: 'Payload too large' }, 413);
  }

  const [[existing]] = await db.batch([
    db
      .select({
        existingSeq: syncRecord.seq,
        existingEncryptionAlgorithm: syncRecord.encryptionAlgorithm,
        existingEncryptionVersion: syncRecord.encryptionVersion,
        existingIv: syncRecord.iv,
        existingCiphertext: syncRecord.ciphertext,
      })
      .from(syncRecord)
      .where(and(eq(syncRecord.userId, userId), eq(syncRecord.id, id))),
  ]);

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

  const [row] = await db
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
          encryptionVersion: sql`${encryptionVersion}`.as('encryption_version'),
          iv: sql`${ivBytes}`.as('iv'),
          ciphertext: sql`${ciphertextBytes}`.as('ciphertext'),
          kind: sql`'update'`.as('kind'),
          encryptionKeyId: sql`${encryptionKeyId}`.as('encryption_key_id'),
          created: sql`CURRENT_TIMESTAMP`.as('created'),
        })
        .from(syncRecord)
        .where(eq(syncRecord.userId, userId))
        .having(
          sql`COALESCE(SUM(LENGTH(${syncRecord.ciphertext})), 0) + ${ciphertextBytes.byteLength} <= ${HARD_CAP_BYTES}`,
        ),
    )
    .returning({
      seq: syncRecord.seq,
      rowCount:
        sql<number>`(SELECT COUNT(*) FROM sync_record WHERE user_id = ${userId})`.as(
          'rowCount',
        ),
      totalBytes:
        sql<number>`(SELECT COALESCE(SUM(LENGTH(ciphertext)), 0) FROM sync_record WHERE user_id = ${userId})`.as(
          'totalBytes',
        ),
    });

  if (!row) {
    return c.json({ error: 'Storage limit exceeded' }, 413);
  }

  const compactHint =
    row.rowCount >= SOFT_CAP_ROWS || row.totalBytes >= SOFT_CAP_BYTES;
  const headers: Record<string, string> = { ETag: `"${row.seq}"` };
  if (compactHint) headers['X-Compact-Hint'] = 'please';
  return c.body(null, 200, headers);
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
  const db = getDb(c.env.DB);
  const keyRingRow = await getActiveKeyRing(db, userId);
  if (!keyRingRow) return codeResponse('encryption_key_not_found', 404);

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
  if (encryptionKeyId !== keyRingRow.activeDekId) {
    return codeResponse('encryption_key_mismatch', 409);
  }
  if (snapshotCiphertext.byteLength > MAX_CIPHERTEXT_BYTES) {
    return c.json({ error: 'Payload too large' }, 413);
  }

  const [[existing]] = await db.batch([
    db
      .select({
        seq: syncRecord.seq,
        encryptionAlgorithm: syncRecord.encryptionAlgorithm,
        encryptionVersion: syncRecord.encryptionVersion,
        iv: syncRecord.iv,
        ciphertext: syncRecord.ciphertext,
      })
      .from(syncRecord)
      .where(and(eq(syncRecord.userId, userId), eq(syncRecord.id, id))),
  ]);

  if (existing) {
    if (
      existing.encryptionAlgorithm === encryptionAlgorithm &&
      existing.encryptionVersion === encryptionVersion &&
      existing.iv.byteLength === ivBytes.byteLength &&
      new Uint8Array(existing.iv).every((v, i) => v === ivBytes[i]) &&
      existing.ciphertext.byteLength === snapshotCiphertext.byteLength &&
      new Uint8Array(existing.ciphertext).every(
        (v, i) => v === snapshotCiphertext[i],
      )
    ) {
      return c.body(null, 200, { ETag: `"${existing.seq}"` });
    }
    return codeResponse('idempotency_conflict', 409);
  }

  const [[meta]] = await db.batch([
    db
      .select({
        head: sql<number>`COALESCE(MAX(${syncRecord.seq}), 0)`,
        rowCount: sql<number>`COUNT(*)`,
        totalBytes: sql<number>`COALESCE(SUM(LENGTH(${syncRecord.ciphertext})), 0)`,
      })
      .from(syncRecord)
      .where(eq(syncRecord.userId, userId)),
  ]);

  const head = meta?.head ?? 0;
  if (replacesUpTo > head) {
    return c.json({ code: 'head_conflict' }, 409);
  }
  if (
    (meta?.totalBytes ?? 0) + snapshotCiphertext.byteLength >
    HARD_CAP_BYTES
  ) {
    return c.json({ error: 'Storage limit exceeded' }, 413);
  }

  const nextSeq = head + 1;
  const [tailRowsResult] = await db.batch([
    db
      .select({ seq: syncRecord.seq, ciphertext: syncRecord.ciphertext })
      .from(syncRecord)
      .where(and(eq(syncRecord.userId, userId), gt(syncRecord.seq, 0)))
      .orderBy(sql`${syncRecord.seq} DESC`)
      .limit(COMPACT_TAIL_MAX_ROWS * 2),
  ]);

  let keepCutoff = head;
  let rowsAccum = 0;
  let bytesAccum = 0;
  for (const row of tailRowsResult) {
    if (rowsAccum >= COMPACT_TAIL_MAX_ROWS) break;
    if (bytesAccum + row.ciphertext.byteLength > COMPACT_TAIL_MAX_BYTES) break;
    keepCutoff = row.seq - 1;
    rowsAccum += 1;
    bytesAccum += row.ciphertext.byteLength;
  }

  const effectiveCutoff = Math.min(replacesUpTo, keepCutoff);
  await db.batch([
    db.insert(syncRecord).values({
      id,
      userId,
      seq: nextSeq,
      encryptionAlgorithm,
      encryptionVersion,
      iv: ivBytes,
      ciphertext: snapshotCiphertext,
      kind: 'snapshot',
      encryptionKeyId,
      created: sql`CURRENT_TIMESTAMP`,
    }),
    ...(effectiveCutoff > 0
      ? [
          db
            .delete(syncRecord)
            .where(
              and(
                eq(syncRecord.userId, userId),
                sql`${syncRecord.seq} <= ${effectiveCutoff}`,
              ),
            ),
        ]
      : []),
  ]);

  const compactHint =
    (meta?.rowCount ?? 0) >= SOFT_CAP_ROWS ||
    (meta?.totalBytes ?? 0) >= SOFT_CAP_BYTES;
  const headers: Record<string, string> = { ETag: `"${nextSeq}"` };
  if (compactHint) headers['X-Compact-Hint'] = 'please';
  return c.body(null, 200, headers);
});

export { router as syncRouter };

async function getActiveKeyRing(db: ReturnType<typeof getDb>, userId: string) {
  const [row] = await db
    .select()
    .from(keyRing)
    .where(eq(keyRing.userId, userId))
    .limit(1);
  return row ?? null;
}
