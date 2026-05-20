import { and, eq, gt, sql } from 'drizzle-orm';
import { Hono } from 'hono';

import { requireSession } from '../auth';
import { getDb } from '../db';
import { updates } from '../db/schema';

const MAX_BLOB_BYTES = 1 * 1024 * 1024;
const SOFT_CAP_ROWS = 200;
const SOFT_CAP_BYTES = 2 * 1024 * 1024;
const HARD_CAP_BYTES = 4 * 1024 * 1024;
const COMPACT_TAIL_MAX_ROWS = 50;
const COMPACT_TAIL_MAX_BYTES = 256 * 1024;

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

  const [[meta], items] = await db.batch([
    db
      .select({
        head: sql<number>`COALESCE(MAX(${updates.seq}), 0)`,
        minSeq: sql<number>`COALESCE(MIN(${updates.seq}), 0)`,
      })
      .from(updates)
      .where(eq(updates.userId, userId)),
    db
      .select({ seq: updates.seq, kind: updates.kind, blob: updates.blob })
      .from(updates)
      .where(and(eq(updates.userId, userId), gt(updates.seq, since)))
      .orderBy(updates.seq),
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

  const buf = new Uint8Array(
    items.reduce((acc, row) => acc + 4 + 1 + 4 + row.blob.byteLength, 0),
  );
  let offset = 0;
  const view = new DataView(buf.buffer);
  for (const row of items) {
    view.setUint32(offset, row.seq, false);
    offset += 4;
    buf[offset] = row.kind === 'snapshot' ? 0x02 : 0x01;
    offset += 1;
    view.setUint32(offset, row.blob.byteLength, false);
    offset += 4;
    buf.set(row.blob, offset);
    offset += row.blob.byteLength;
  }

  return c.body(buf, 200, {
    'Content-Type': 'application/octet-stream',
    ETag: etag,
  });
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

  const contentLength = parseInt(c.req.header('Content-Length') ?? '', 10);
  if (Number.isNaN(contentLength) || contentLength > MAX_BLOB_BYTES) {
    return c.json({ error: 'Payload too large' }, 413);
  }

  const contentType = c.req.header('Content-Type') ?? '';
  if (contentType !== 'application/octet-stream') {
    return c.json(
      { error: 'Content-Type must be application/octet-stream' },
      415,
    );
  }

  const idempotencyKey = c.req.header('Idempotency-Key');
  if (!idempotencyKey) {
    return c.json({ error: 'Missing Idempotency-Key header' }, 400);
  }

  const blob = new Uint8Array(await c.req.arrayBuffer());
  const db = getDb(c.env.DB);

  const [[existing]] = await db.batch([
    db
      .select({ existingSeq: updates.seq, existingBlob: updates.blob })
      .from(updates)
      .where(
        and(
          eq(updates.userId, userId),
          eq(updates.idempotencyKey, idempotencyKey),
        ),
      ),
  ]);

  if (existing) {
    if (
      existing.existingBlob.byteLength === blob.byteLength &&
      new Uint8Array(existing.existingBlob).every((v, i) => v === blob[i])
    ) {
      return c.body(null, 200, { ETag: `"${existing.existingSeq}"` });
    }
    return codeResponse('idempotency_conflict', 409);
  }

  const [row] = await db
    .insert(updates)
    .select(
      db
        .select({
          userId: sql`${userId}`.as('user_id'),
          seq: sql`COALESCE(MAX(${updates.seq}), 0) + 1`.as('seq'),
          blob: sql`${blob}`.as('blob'),
          kind: sql`'update'`.as('kind'),
          idempotencyKey: sql`${idempotencyKey}`.as('idempotency_key'),
          created: sql`CURRENT_TIMESTAMP`.as('created'),
        })
        .from(updates)
        .where(eq(updates.userId, userId))
        .having(
          sql`COALESCE(SUM(LENGTH(${updates.blob})), 0) + ${blob.byteLength} <= ${HARD_CAP_BYTES}`,
        ),
    )
    .returning({
      seq: updates.seq,
      rowCount:
        sql<number>`(SELECT COUNT(*) FROM updates WHERE user_id = ${userId})`.as(
          'rowCount',
        ),
      totalBytes:
        sql<number>`(SELECT COALESCE(SUM(LENGTH(blob)), 0) FROM updates WHERE user_id = ${userId})`.as(
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

  const contentLength = parseInt(c.req.header('Content-Length') ?? '', 10);
  if (Number.isNaN(contentLength) || contentLength > MAX_BLOB_BYTES) {
    return c.json({ error: 'Payload too large' }, 413);
  }

  const contentType = c.req.header('Content-Type') ?? '';
  if (contentType !== 'application/octet-stream') {
    return c.json(
      { error: 'Content-Type must be application/octet-stream' },
      415,
    );
  }

  const idempotencyKey = c.req.header('Idempotency-Key');
  const replacesUpToStr = c.req.header('X-Replaces-Up-To');
  if (!idempotencyKey || !replacesUpToStr) {
    return c.json({ code: 'missing_required_headers' }, 400);
  }

  const replacesUpTo = parseInt(replacesUpToStr, 10);
  if (Number.isNaN(replacesUpTo)) {
    return c.json({ error: 'Invalid X-Replaces-Up-To header' }, 400);
  }

  const snapshotBlob = new Uint8Array(await c.req.arrayBuffer());
  const db = getDb(c.env.DB);

  const [[existing]] = await db.batch([
    db
      .select({ seq: updates.seq, blob: updates.blob })
      .from(updates)
      .where(
        and(
          eq(updates.userId, userId),
          eq(updates.idempotencyKey, idempotencyKey),
        ),
      ),
  ]);

  if (existing) {
    if (
      existing.blob.byteLength === snapshotBlob.byteLength &&
      new Uint8Array(existing.blob).every((v, i) => v === snapshotBlob[i])
    ) {
      return c.body(null, 200, { ETag: `"${existing.seq}"` });
    }
    return codeResponse('idempotency_conflict', 409);
  }

  const [[meta]] = await db.batch([
    db
      .select({
        head: sql<number>`COALESCE(MAX(${updates.seq}), 0)`,
        rowCount: sql<number>`COUNT(*)`,
        totalBytes: sql<number>`COALESCE(SUM(LENGTH(${updates.blob})), 0)`,
      })
      .from(updates)
      .where(eq(updates.userId, userId)),
  ]);

  const head = meta?.head ?? 0;
  if (replacesUpTo > head) {
    return c.json({ code: 'head_conflict' }, 409);
  }
  if ((meta?.totalBytes ?? 0) + snapshotBlob.byteLength > HARD_CAP_BYTES) {
    return c.json({ error: 'Storage limit exceeded' }, 413);
  }

  const nextSeq = head + 1;
  const [tailRowsResult] = await db.batch([
    db
      .select({ seq: updates.seq, blob: updates.blob })
      .from(updates)
      .where(and(eq(updates.userId, userId), gt(updates.seq, 0)))
      .orderBy(sql`${updates.seq} DESC`)
      .limit(COMPACT_TAIL_MAX_ROWS * 2),
  ]);

  let keepCutoff = head;
  let rowsAccum = 0;
  let bytesAccum = 0;
  for (const row of tailRowsResult) {
    if (rowsAccum >= COMPACT_TAIL_MAX_ROWS) break;
    if (bytesAccum + row.blob.byteLength > COMPACT_TAIL_MAX_BYTES) break;
    keepCutoff = row.seq - 1;
    rowsAccum += 1;
    bytesAccum += row.blob.byteLength;
  }

  const effectiveCutoff = Math.min(replacesUpTo, keepCutoff);
  await db.batch([
    db.insert(updates).values({
      userId,
      seq: nextSeq,
      blob: snapshotBlob,
      kind: 'snapshot',
      idempotencyKey,
      created: sql`CURRENT_TIMESTAMP`,
    }),
    ...(effectiveCutoff > 0
      ? [
          db
            .delete(updates)
            .where(
              and(
                eq(updates.userId, userId),
                sql`${updates.seq} <= ${effectiveCutoff}`,
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
