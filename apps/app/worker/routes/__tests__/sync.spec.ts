import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';

import {
  clearAuthData,
  workerTestEnv,
} from '../../../tests/worker/auth-helpers';
import {
  makeAuthHeaders,
  mergeHeaders,
  mockCtx,
  type SessionState,
} from '../../../tests/worker/request-helpers';
import app from '../../app/app';
import {
  MAX_SYNC_BODY_BYTES,
  MAX_SYNC_CIPHERTEXT_BYTES,
  maxBase64Length,
} from '../../constants';
import { getDb } from '../../db';
import { keyRing, syncRecord } from '../../db/schema';

const sessionState: SessionState = { userId: 'user-1', headers: null };
const authHeaders = makeAuthHeaders(sessionState);
const TEST_KEY_ID = '11111111-1111-4111-8111-111111111111';
const NEXT_KEY_ID = '22222222-2222-4222-8222-222222222222';
const TEST_ALGORITHM = 'aes-256-gcm';

async function syncRequest(path: string, init?: RequestInit | Request) {
  const headers = mergeHeaders(
    init instanceof Request ? init.headers : init?.headers,
    await authHeaders(),
  );
  const url = init instanceof Request ? init.url : `http://localhost${path}`;
  const request = new Request(url, {
    ...(init instanceof Request ? init : init),
    headers,
  });
  return app.request(request, undefined, workerTestEnv, mockCtx);
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function makeCiphertext(values: number[]): Uint8Array {
  return new Uint8Array(values);
}

function syncHeaders(
  headers: Record<string, string> = {},
): Record<string, string> {
  return {
    'X-Local-User-Id': 'user-1',
    ...headers,
  };
}

const TEST_IV = new Uint8Array(12).fill(0xcd);

function pushBody(ciphertext: Uint8Array, id = crypto.randomUUID()) {
  return {
    method: 'POST',
    headers: syncHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      id,
      encryptionKeyId: TEST_KEY_ID,
      keyRingRevision: 1,
      encryptionAlgorithm: TEST_ALGORITHM,
      encryptionParams: { iv: toBase64(TEST_IV), tagBits: 128 },
      ciphertext: toBase64(ciphertext),
    }),
  };
}

function compactBody(
  ciphertext: Uint8Array,
  replacesUpTo: number,
  id = crypto.randomUUID(),
) {
  return {
    method: 'POST',
    headers: syncHeaders({
      'Content-Type': 'application/json',
      'X-Replaces-Up-To': String(replacesUpTo),
    }),
    body: JSON.stringify({
      id,
      encryptionKeyId: TEST_KEY_ID,
      keyRingRevision: 1,
      encryptionAlgorithm: TEST_ALGORITHM,
      encryptionParams: { iv: toBase64(TEST_IV), tagBits: 128 },
      ciphertext: toBase64(ciphertext),
    }),
  };
}

async function insertTestKeyRing() {
  const db = getDb(workerTestEnv.DB);
  await db
    .insert(keyRing)
    .values({
      id: 'key-ring-1',
      userId: 'user-1',
      activeDekId: TEST_KEY_ID,
      encryptionAlgorithm: TEST_ALGORITHM,
      encryptionParams: JSON.stringify({
        iv: toBase64(new Uint8Array(12)),
        tagBits: 128,
      }),
      ciphertext: new Uint8Array(16),
    })
    .onConflictDoNothing();
}

describe('GET /api/sync/pull', () => {
  afterEach(async () => {
    sessionState.userId = 'user-1';
    sessionState.headers = null;
    await workerTestEnv.DB.exec('DELETE FROM sync_record');
    await workerTestEnv.DB.exec('DELETE FROM key_ring_wrapping');
    await workerTestEnv.DB.exec('DELETE FROM key_ring');
    await clearAuthData();
  });

  it('returns 401 for missing authenticated session', async () => {
    sessionState.userId = null;
    const res = await syncRequest('/api/sync/pull?since=0', {
      headers: syncHeaders(),
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ code: 'unauthorized' });
  });

  it('returns 400 when X-Local-User-Id is missing', async () => {
    const res = await syncRequest('/api/sync/pull?since=0');
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ code: 'missing_local_user_id' });
  });

  it('returns 409 when X-Local-User-Id mismatches session user', async () => {
    const res = await syncRequest('/api/sync/pull?since=0', {
      headers: { 'X-Local-User-Id': 'other-user' },
    });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ code: 'local_user_mismatch' });
  });

  it('returns 400 when ?since is not a valid non-negative integer', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const res = await syncRequest('/api/sync/pull?since=abc', {
      headers: syncHeaders(),
    });
    expect(res.status).toBe(400);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('returns JSON records array with head in body', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const ciphertexts = [
      makeCiphertext([1]),
      makeCiphertext([2]),
      makeCiphertext([3]),
    ];
    for (let i = 0; i < 3; i++) {
      await syncRequest('/api/sync/push', pushBody(ciphertexts[i]));
    }

    const res = await syncRequest('/api/sync/pull?since=0', {
      headers: syncHeaders(),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    expect(res.headers.get('Cache-Control')).toBe('no-store');

    const rawBody: unknown = await res.json();
    const body = rawBody as {
      head: number;
      records: Array<{
        seq: number;
        kind: string;
        encryptionKeyId: string;
        encryptionAlgorithm: string;
        encryptionParams: { iv: string; tagBits: number };
        ciphertext: string;
      }>;
    };
    expect(body.head).toBe(3);
    expect(body.records).toHaveLength(3);
    expect(body.records[0].seq).toBe(1);
    expect(body.records[0].kind).toBe('update');
    expect(body.records[0].encryptionKeyId).toBe(TEST_KEY_ID);
    expect(body.records[0].encryptionAlgorithm).toBe(TEST_ALGORITHM);
    expect(body.records[0].encryptionParams.iv).toBe(toBase64(TEST_IV));
    expect(body.records[0].encryptionParams.tagBits).toBe(128);
    expect(body.records[0].ciphertext).toBe(toBase64(ciphertexts[0]));
    expect(body.records[1].seq).toBe(2);
    expect(body.records[2].seq).toBe(3);
  });

  it('since=head returns 200 with empty records', async () => {
    await authHeaders();
    await insertTestKeyRing();
    for (let i = 0; i < 3; i++) {
      await syncRequest('/api/sync/push', pushBody(makeCiphertext([i])));
    }

    const res = await syncRequest('/api/sync/pull?since=3', {
      headers: syncHeaders(),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const rawBody: unknown = await res.json();
    const body = rawBody as { head: number; records: unknown[] };
    expect(body.head).toBe(3);
    expect(body.records).toHaveLength(0);
  });

  it('transitional: If-None-Match cursor is used when ?since is absent', async () => {
    await authHeaders();
    await insertTestKeyRing();
    for (let i = 0; i < 5; i++) {
      await syncRequest('/api/sync/push', pushBody(makeCiphertext([i])));
    }

    const res = await syncRequest('/api/sync', {
      headers: syncHeaders({ 'If-None-Match': '"2"' }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const rawBody: unknown = await res.json();
    const body = rawBody as { head: number; records: Array<{ seq: number }> };
    expect(body.head).toBe(5);
    expect(body.records.map((r) => r.seq)).toEqual([3, 4, 5]);
  });

  it('transitional: returns 304 when If-None-Match matches head', async () => {
    await authHeaders();
    await insertTestKeyRing();
    for (let i = 0; i < 3; i++) {
      await syncRequest('/api/sync/push', pushBody(makeCiphertext([i])));
    }

    const res = await syncRequest('/api/sync', {
      headers: syncHeaders({ 'If-None-Match': '"3"' }),
    });
    expect(res.status).toBe(304);
    expect(res.headers.get('ETag')).toBe('"3"');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('returns full records when no If-None-Match header', async () => {
    await authHeaders();
    await insertTestKeyRing();
    for (let i = 0; i < 2; i++) {
      await syncRequest('/api/sync/push', pushBody(makeCiphertext([i])));
    }

    const res = await syncRequest('/api/sync/pull?since=0', {
      headers: syncHeaders(),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const rawBody: unknown = await res.json();
    const body = rawBody as { records: unknown[] };
    expect(body.records).toHaveLength(2);
  });

  it('returns latest snapshot plus later rows for fresh pull', async () => {
    await authHeaders();
    await insertTestKeyRing();
    for (let i = 0; i < 3; i++) {
      await syncRequest('/api/sync/push', pushBody(makeCiphertext([i])));
    }

    const compactRes = await syncRequest(
      '/api/sync/compact',
      compactBody(makeCiphertext([99]), 3),
    );
    expect(compactRes.status).toBe(200);
    await syncRequest('/api/sync/push', pushBody(makeCiphertext([4])));
    await syncRequest('/api/sync/push', pushBody(makeCiphertext([5])));

    const res = await syncRequest('/api/sync/pull?since=0', {
      headers: syncHeaders(),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const rawBody: unknown = await res.json();
    const body = rawBody as {
      head: number;
      records: Array<{ seq: number; kind: string }>;
    };
    expect(body.head).toBe(6);
    expect(body.records).toEqual([
      expect.objectContaining({ seq: 4, kind: 'snapshot' }),
      expect.objectContaining({ seq: 5, kind: 'update' }),
      expect.objectContaining({ seq: 6, kind: 'update' }),
    ]);
  });

  it('returns 410 when cursor is older than latest snapshot', async () => {
    await authHeaders();
    await insertTestKeyRing();
    for (let i = 0; i < 3; i++) {
      await syncRequest('/api/sync/push', pushBody(makeCiphertext([i])));
    }
    const compactRes = await syncRequest(
      '/api/sync/compact',
      compactBody(makeCiphertext([99]), 3),
    );
    expect(compactRes.status).toBe(200);

    const res = await syncRequest('/api/sync/pull?since=3', {
      headers: syncHeaders(),
    });

    expect(res.status).toBe(410);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('returns later rows when cursor is at latest snapshot', async () => {
    await authHeaders();
    await insertTestKeyRing();
    for (let i = 0; i < 3; i++) {
      await syncRequest('/api/sync/push', pushBody(makeCiphertext([i])));
    }
    const compactRes = await syncRequest(
      '/api/sync/compact',
      compactBody(makeCiphertext([99]), 3),
    );
    expect(compactRes.status).toBe(200);
    await syncRequest('/api/sync/push', pushBody(makeCiphertext([4])));
    await syncRequest('/api/sync/push', pushBody(makeCiphertext([5])));

    const res = await syncRequest('/api/sync/pull?since=4', {
      headers: syncHeaders(),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const rawBody: unknown = await res.json();
    const body = rawBody as {
      head: number;
      records: Array<{ seq: number; kind: string }>;
    };
    expect(body.head).toBe(6);
    expect(body.records).toEqual([
      expect.objectContaining({ seq: 5, kind: 'update' }),
      expect.objectContaining({ seq: 6, kind: 'update' }),
    ]);
  });

  it('returns 410 when cursor is newer than head', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const res = await syncRequest('/api/sync/pull?since=999', {
      headers: syncHeaders(),
    });
    expect(res.status).toBe(410);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('returns empty records with head=0 when no records exist', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const res = await syncRequest('/api/sync/pull?since=0', {
      headers: syncHeaders(),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const rawBody: unknown = await res.json();
    const body = rawBody as { head: number; records: unknown[] };
    expect(body.head).toBe(0);
    expect(body.records).toHaveLength(0);
  });

  it('includes keyRingRevision in pull response records', async () => {
    await authHeaders();
    await insertTestKeyRing();
    await syncRequest('/api/sync/push', pushBody(makeCiphertext([1])));

    const res = await syncRequest('/api/sync/pull?since=0', {
      headers: syncHeaders(),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const rawBody: unknown = await res.json();
    const body = rawBody as {
      records: Array<{ keyRingRevision: unknown }>;
    };
    expect(body.records).toHaveLength(1);
    expect(body.records[0].keyRingRevision).toBe(1);
  });
});

describe('POST /api/sync/push', () => {
  afterEach(async () => {
    sessionState.userId = 'user-1';
    sessionState.headers = null;
    await workerTestEnv.DB.exec('DELETE FROM sync_record');
    await workerTestEnv.DB.exec('DELETE FROM key_ring_wrapping');
    await workerTestEnv.DB.exec('DELETE FROM key_ring');
    await clearAuthData();
  });

  it('returns 401 when request is unauthenticated', async () => {
    sessionState.userId = null;
    const res = await syncRequest('/api/sync/push', {
      method: 'POST',
      headers: syncHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        id: 'uuid-1',
        encryptionKeyId: TEST_KEY_ID,
        encryptionAlgorithm: TEST_ALGORITHM,
        encryptionParams: { iv: toBase64(TEST_IV), tagBits: 128 },
        ciphertext: toBase64(makeCiphertext([1])),
      }),
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ code: 'unauthorized' });
  });

  it('returns 400 for missing or invalid body fields', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const res = await syncRequest('/api/sync/push', {
      method: 'POST',
      headers: syncHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ ciphertext: toBase64(makeCiphertext([1])) }), // missing id and encryptionKeyId
    });
    expect(res.status).toBe(400);
  });

  it('returns 413 before JSON validation when request body exceeds sync body limit', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const res = await syncRequest('/api/sync/push', {
      method: 'POST',
      headers: syncHeaders({ 'Content-Type': 'application/json' }),
      body: ' '.repeat(MAX_SYNC_BODY_BYTES + 1),
    });

    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ code: 'payload_too_large' });
  });

  it('returns 400 for non-UUID frontend-provided ids', async () => {
    await authHeaders();
    await insertTestKeyRing();

    const invalidRecordId = await syncRequest(
      '/api/sync/push',
      pushBody(makeCiphertext([1]), 'not-a-uuid'),
    );
    expect(invalidRecordId.status).toBe(400);

    const invalidKeyId = await syncRequest('/api/sync/push', {
      method: 'POST',
      headers: syncHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        id: crypto.randomUUID(),
        encryptionKeyId: 'not-a-uuid',
        encryptionAlgorithm: TEST_ALGORITHM,
        encryptionParams: { iv: toBase64(TEST_IV), tagBits: 128 },
        ciphertext: toBase64(makeCiphertext([1])),
      }),
    });
    expect(invalidKeyId.status).toBe(400);
  });

  it('assigns sequential assignedSeq in body and sets Cache-Control: no-store', async () => {
    await authHeaders();
    await insertTestKeyRing();

    const r1 = await syncRequest(
      '/api/sync/push',
      pushBody(makeCiphertext([1])),
    );
    expect(r1.status).toBe(200);
    expect(r1.headers.get('Cache-Control')).toBe('no-store');
    const b1 = (await r1.json()) as {
      assignedSeq: number;
      compactHint: boolean;
    };
    expect(b1.assignedSeq).toBe(1);
    expect(b1.compactHint).toBe(false);

    const r2 = await syncRequest(
      '/api/sync/push',
      pushBody(makeCiphertext([2])),
    );
    expect(r2.status).toBe(200);
    expect(r2.headers.get('Cache-Control')).toBe('no-store');
    const b2 = (await r2.json()) as {
      assignedSeq: number;
      compactHint: boolean;
    };
    expect(b2.assignedSeq).toBe(2);
  });

  it('idempotent duplicate returns same assignedSeq in body', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const id = crypto.randomUUID();
    const ciphertext = makeCiphertext([42]);

    const r1 = await syncRequest('/api/sync/push', pushBody(ciphertext, id));
    expect(r1.status).toBe(200);
    expect(r1.headers.get('Cache-Control')).toBe('no-store');
    const b1 = (await r1.json()) as { assignedSeq: number };
    expect(b1.assignedSeq).toBe(1);

    const r2 = await syncRequest('/api/sync/push', pushBody(ciphertext, id));
    expect(r2.status).toBe(200);
    expect(r2.headers.get('Cache-Control')).toBe('no-store');
    const b2 = (await r2.json()) as { assignedSeq: number };
    expect(b2.assignedSeq).toBe(1);
  });

  it('same id different ciphertext returns 409', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const id = crypto.randomUUID();

    const r1 = await syncRequest(
      '/api/sync/push',
      pushBody(makeCiphertext([1]), id),
    );
    expect(r1.status).toBe(200);

    const r2 = await syncRequest(
      '/api/sync/push',
      pushBody(makeCiphertext([2]), id),
    );
    expect(r2.status).toBe(409);
    expect(await r2.json()).toEqual({ code: 'idempotency_conflict' });
  });

  it('compactHint is true in body when over soft cap rows', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const ciphertext = makeCiphertext([1]);
    for (let i = 0; i < 200; i++) {
      await syncRequest('/api/sync/push', pushBody(ciphertext));
    }

    const res = await syncRequest('/api/sync/push', pushBody(ciphertext));

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const body = (await res.json()) as {
      assignedSeq: number;
      compactHint: boolean;
    };
    expect(body.compactHint).toBe(true);
  }, 15000);

  it('returns 413 when hard cap exceeded', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const ciphertext = new Uint8Array(1024 * 1024);
    for (let i = 0; i < 4; i++) {
      await syncRequest('/api/sync/push', pushBody(ciphertext));
    }

    const res = await syncRequest(
      '/api/sync/push',
      pushBody(makeCiphertext([1])),
    );
    expect(res.status).toBe(413);
  });

  it('returns 413 when single ciphertext exceeds MAX_CIPHERTEXT_BYTES', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const oversized = new Uint8Array(1024 * 1024 + 17);

    const res = await syncRequest('/api/sync/push', pushBody(oversized));
    expect(res.status).toBe(413);
  });

  it('returns 413 before decoding when ciphertext base64 is too long', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const res = await syncRequest('/api/sync/push', {
      method: 'POST',
      headers: syncHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        id: crypto.randomUUID(),
        encryptionKeyId: TEST_KEY_ID,
        keyRingRevision: 1,
        encryptionAlgorithm: TEST_ALGORITHM,
        encryptionParams: { iv: toBase64(TEST_IV), tagBits: 128 },
        ciphertext: 'A'.repeat(maxBase64Length(MAX_SYNC_CIPHERTEXT_BYTES) + 1),
      }),
    });

    expect(res.status).toBe(413);
  });

  it('database rejects sync rows above the ciphertext size limit', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const db = getDb(workerTestEnv.DB);

    await expect(
      db.insert(syncRecord).values({
        id: crypto.randomUUID(),
        userId: 'user-1',
        seq: 1,
        encryptionAlgorithm: TEST_ALGORITHM,
        encryptionParams: JSON.stringify({
          iv: toBase64(TEST_IV),
          tagBits: 128,
        }),
        keyRingRevision: 1,
        ciphertext: new Uint8Array(MAX_SYNC_CIPHERTEXT_BYTES + 1),
        kind: 'update',
        encryptionKeyId: TEST_KEY_ID,
      }),
    ).rejects.toThrow();
  });

  it('returns 409 write_conflict when encryptionKeyId does not match active DEK at write time', async () => {
    await authHeaders();
    await insertTestKeyRing();

    const wrongKeyId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const res = await syncRequest('/api/sync/push', {
      method: 'POST',
      headers: syncHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        id: crypto.randomUUID(),
        encryptionKeyId: wrongKeyId,
        keyRingRevision: 1,
        encryptionAlgorithm: TEST_ALGORITHM,
        encryptionParams: { iv: toBase64(TEST_IV), tagBits: 128 },
        ciphertext: toBase64(makeCiphertext([1])),
      }),
    });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ code: 'write_conflict' });

    const db = getDb(workerTestEnv.DB);
    const rows = await db
      .select()
      .from(syncRecord)
      .where(eq(syncRecord.userId, 'user-1'));
    expect(rows).toHaveLength(0);
  });

  it('rejects old-DEK push after key ring active DEK changes', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const db = getDb(workerTestEnv.DB);
    await db
      .update(keyRing)
      .set({ activeDekId: NEXT_KEY_ID, revision: 2 })
      .where(eq(keyRing.userId, 'user-1'));

    const res = await syncRequest(
      '/api/sync/push',
      pushBody(makeCiphertext([1])),
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ code: 'write_conflict' });
    const rows = await db
      .select()
      .from(syncRecord)
      .where(eq(syncRecord.userId, 'user-1'));
    expect(rows).toHaveLength(0);
  });

  it('returns 409 write_conflict when keyRingRevision does not match stored revision', async () => {
    await authHeaders();
    await insertTestKeyRing();

    const res = await syncRequest('/api/sync/push', {
      method: 'POST',
      headers: syncHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        id: crypto.randomUUID(),
        encryptionKeyId: TEST_KEY_ID,
        keyRingRevision: 999,
        encryptionAlgorithm: TEST_ALGORITHM,
        encryptionParams: { iv: toBase64(TEST_IV), tagBits: 128 },
        ciphertext: toBase64(makeCiphertext([1])),
      }),
    });

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ code: 'write_conflict' });
    const db = getDb(workerTestEnv.DB);
    const rows = await db
      .select()
      .from(syncRecord)
      .where(eq(syncRecord.userId, 'user-1'));
    expect(rows).toHaveLength(0);
  });
});

describe('POST /api/sync/compact', () => {
  afterEach(async () => {
    sessionState.userId = 'user-1';
    sessionState.headers = null;
    await workerTestEnv.DB.exec('DELETE FROM sync_record');
    await workerTestEnv.DB.exec('DELETE FROM key_ring_wrapping');
    await workerTestEnv.DB.exec('DELETE FROM key_ring');
    await clearAuthData();
  });

  it('inserts snapshot and returns assignedSeq in body with Cache-Control: no-store', async () => {
    await authHeaders();
    await insertTestKeyRing();
    for (let i = 0; i < 5; i++) {
      await syncRequest('/api/sync/push', pushBody(makeCiphertext([i])));
    }

    const res = await syncRequest(
      '/api/sync/compact',
      compactBody(makeCiphertext([99]), 5),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const body = (await res.json()) as { assignedSeq: number };
    expect(body.assignedSeq).toBe(6);
  });

  it('idempotent repeat returns same assignedSeq without re-inserting', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const id = crypto.randomUUID();

    const r1 = await syncRequest(
      '/api/sync/compact',
      compactBody(makeCiphertext([99]), 0, id),
    );
    expect(r1.status).toBe(200);
    expect(r1.headers.get('Cache-Control')).toBe('no-store');
    const b1 = (await r1.json()) as { assignedSeq: number };

    const r2 = await syncRequest(
      '/api/sync/compact',
      compactBody(makeCiphertext([99]), 0, id),
    );
    expect(r2.status).toBe(200);
    expect(r2.headers.get('Cache-Control')).toBe('no-store');
    const b2 = (await r2.json()) as { assignedSeq: number };
    expect(b2.assignedSeq).toBe(b1.assignedSeq);

    const getRes = await syncRequest('/api/sync/pull?since=0', {
      headers: syncHeaders(),
    });
    const rawBody: unknown = await getRes.json();
    const body = rawBody as { records: Array<{ kind: string }> };
    const snapshots = body.records.filter((r) => r.kind === 'snapshot');
    expect(snapshots).toHaveLength(1);
  });

  it('returns 409 when X-Replaces-Up-To exceeds head', async () => {
    await authHeaders();
    await insertTestKeyRing();
    for (let i = 0; i < 3; i++) {
      await syncRequest('/api/sync/push', pushBody(makeCiphertext([i])));
    }

    const res = await syncRequest(
      '/api/sync/compact',
      compactBody(makeCiphertext([99]), 999),
    );
    expect(res.status).toBe(409);
  });

  it('returns 400 for missing X-Replaces-Up-To header', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const res = await syncRequest('/api/sync/compact', {
      method: 'POST',
      headers: syncHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        id: crypto.randomUUID(),
        encryptionKeyId: TEST_KEY_ID,
        encryptionAlgorithm: TEST_ALGORITHM,
        encryptionParams: { iv: toBase64(TEST_IV), tagBits: 128 },
        ciphertext: toBase64(makeCiphertext([99])),
      }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 413 before JSON validation when compact body exceeds sync body limit', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const res = await syncRequest('/api/sync/compact', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/json',
        'X-Replaces-Up-To': '0',
      }),
      body: ' '.repeat(MAX_SYNC_BODY_BYTES + 1),
    });

    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ code: 'payload_too_large' });
  });

  it('returns 413 before decoding when compact ciphertext base64 is too long', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const res = await syncRequest('/api/sync/compact', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/json',
        'X-Replaces-Up-To': '0',
      }),
      body: JSON.stringify({
        id: crypto.randomUUID(),
        encryptionKeyId: TEST_KEY_ID,
        keyRingRevision: 1,
        encryptionAlgorithm: TEST_ALGORITHM,
        encryptionParams: { iv: toBase64(TEST_IV), tagBits: 128 },
        ciphertext: 'A'.repeat(maxBase64Length(MAX_SYNC_CIPHERTEXT_BYTES) + 1),
      }),
    });

    expect(res.status).toBe(413);
  });

  it('returns 400 for non-UUID compact ids', async () => {
    await authHeaders();
    await insertTestKeyRing();

    const invalidRecordId = await syncRequest(
      '/api/sync/compact',
      compactBody(makeCiphertext([99]), 0, 'not-a-uuid'),
    );
    expect(invalidRecordId.status).toBe(400);

    const invalidKeyId = await syncRequest('/api/sync/compact', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/json',
        'X-Replaces-Up-To': '0',
      }),
      body: JSON.stringify({
        id: crypto.randomUUID(),
        encryptionKeyId: 'not-a-uuid',
        encryptionAlgorithm: TEST_ALGORITHM,
        encryptionParams: { iv: toBase64(TEST_IV), tagBits: 128 },
        ciphertext: toBase64(makeCiphertext([99])),
      }),
    });
    expect(invalidKeyId.status).toBe(400);
  });

  it('deletes all covered rows without retaining a tail', async () => {
    await authHeaders();
    await insertTestKeyRing();
    for (let i = 0; i < 5; i++) {
      await syncRequest('/api/sync/push', pushBody(makeCiphertext([i])));
    }

    const compactRes = await syncRequest(
      '/api/sync/compact',
      compactBody(makeCiphertext([99]), 5),
    );
    expect(compactRes.status).toBe(200);

    const db = getDb(workerTestEnv.DB);
    const rows = await db
      .select({ seq: syncRecord.seq, kind: syncRecord.kind })
      .from(syncRecord)
      .where(eq(syncRecord.userId, 'user-1'));
    expect(rows).toEqual([{ seq: 6, kind: 'snapshot' }]);

    const getRes = await syncRequest('/api/sync/pull?since=0', {
      headers: syncHeaders(),
    });
    const rawBody2: unknown = await getRes.json();
    const body = rawBody2 as {
      records: Array<{ seq: number; kind: string }>;
    };
    expect(body.records).toEqual([
      expect.objectContaining({ seq: 6, kind: 'snapshot' }),
    ]);
  });

  it('JSON body is accepted', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const res = await syncRequest(
      '/api/sync/compact',
      compactBody(new Uint8Array([0xde, 0xad, 0xbe, 0xef]), 0),
    );
    expect(res.status).toBe(200);
  });

  it('returns 409 write_conflict when encryptionKeyId does not match active DEK at write time', async () => {
    await authHeaders();
    await insertTestKeyRing();
    for (let i = 0; i < 3; i++) {
      await syncRequest('/api/sync/push', pushBody(makeCiphertext([i])));
    }

    const wrongKeyId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const res = await syncRequest('/api/sync/compact', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/json',
        'X-Replaces-Up-To': '3',
      }),
      body: JSON.stringify({
        id: crypto.randomUUID(),
        encryptionKeyId: wrongKeyId,
        keyRingRevision: 1,
        encryptionAlgorithm: TEST_ALGORITHM,
        encryptionParams: { iv: toBase64(TEST_IV), tagBits: 128 },
        ciphertext: toBase64(makeCiphertext([99])),
      }),
    });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ code: 'write_conflict' });

    const db = getDb(workerTestEnv.DB);
    const rows = await db
      .select()
      .from(syncRecord)
      .where(eq(syncRecord.userId, 'user-1'));
    expect(rows.filter((r) => r.kind === 'snapshot')).toHaveLength(0);
    expect(rows.filter((r) => r.kind === 'update')).toHaveLength(3);
  });

  it('returns 409 write_conflict when compact keyRingRevision does not match stored revision', async () => {
    await authHeaders();
    await insertTestKeyRing();
    for (let i = 0; i < 3; i++) {
      await syncRequest('/api/sync/push', pushBody(makeCiphertext([i])));
    }

    const res = await syncRequest('/api/sync/compact', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/json',
        'X-Replaces-Up-To': '3',
      }),
      body: JSON.stringify({
        id: crypto.randomUUID(),
        encryptionKeyId: TEST_KEY_ID,
        keyRingRevision: 999,
        encryptionAlgorithm: TEST_ALGORITHM,
        encryptionParams: { iv: toBase64(TEST_IV), tagBits: 128 },
        ciphertext: toBase64(makeCiphertext([99])),
      }),
    });

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ code: 'write_conflict' });
    const db = getDb(workerTestEnv.DB);
    const rows = await db
      .select()
      .from(syncRecord)
      .where(eq(syncRecord.userId, 'user-1'));
    expect(rows.filter((r) => r.kind === 'snapshot')).toHaveLength(0);
    expect(rows.filter((r) => r.kind === 'update')).toHaveLength(3);
  });

  it('rejects old-DEK compact after key ring active DEK changes', async () => {
    await authHeaders();
    await insertTestKeyRing();
    for (let i = 0; i < 3; i++) {
      await syncRequest('/api/sync/push', pushBody(makeCiphertext([i])));
    }
    const db = getDb(workerTestEnv.DB);
    await db
      .update(keyRing)
      .set({ activeDekId: NEXT_KEY_ID, revision: 2 })
      .where(eq(keyRing.userId, 'user-1'));

    const res = await syncRequest(
      '/api/sync/compact',
      compactBody(makeCiphertext([99]), 3),
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ code: 'write_conflict' });
    const rows = await db
      .select()
      .from(syncRecord)
      .where(eq(syncRecord.userId, 'user-1'));
    expect(rows.filter((r) => r.kind === 'snapshot')).toHaveLength(0);
    expect(rows.filter((r) => r.kind === 'update')).toHaveLength(3);
  });
});

// TODO(follow-up): remove once old alias routes (GET /api/sync, POST /api/sync) are removed
describe('backward-compat aliases', () => {
  afterEach(async () => {
    sessionState.userId = 'user-1';
    sessionState.headers = null;
    await workerTestEnv.DB.exec('DELETE FROM sync_record');
    await workerTestEnv.DB.exec('DELETE FROM key_ring_wrapping');
    await workerTestEnv.DB.exec('DELETE FROM key_ring');
    await clearAuthData();
  });

  it('GET /api/sync returns same pull response as GET /api/sync/pull', async () => {
    await authHeaders();
    await insertTestKeyRing();
    await syncRequest('/api/sync/push', pushBody(makeCiphertext([1])));

    const aliasRes = await syncRequest('/api/sync?since=0', {
      headers: syncHeaders(),
    });
    const canonicalRes = await syncRequest('/api/sync/pull?since=0', {
      headers: syncHeaders(),
    });

    expect(aliasRes.status).toBe(200);
    expect(canonicalRes.status).toBe(200);
    const aliasBody = (await aliasRes.json()) as {
      head: number;
      records: Array<{ seq: number }>;
    };
    const canonicalBody = (await canonicalRes.json()) as {
      head: number;
      records: Array<{ seq: number }>;
    };
    expect(aliasBody.head).toBe(canonicalBody.head);
    expect(aliasBody.records.map((r) => r.seq)).toEqual(
      canonicalBody.records.map((r) => r.seq),
    );
  });

  it('POST /api/sync accepts push and returns assignedSeq', async () => {
    await authHeaders();
    await insertTestKeyRing();

    const res = await syncRequest('/api/sync', pushBody(makeCiphertext([1])));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      assignedSeq: number;
      compactHint: boolean;
    };
    expect(body.assignedSeq).toBe(1);
    expect(body.compactHint).toBe(false);
  });
});
