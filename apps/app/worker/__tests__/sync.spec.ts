import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';

import { clearAuthData, workerTestEnv } from '../../tests/worker/auth-helpers';
import {
  makeAuthHeaders,
  mergeHeaders,
  mockCtx,
  type SessionState,
} from '../../tests/worker/request-helpers';
import { getDb } from '../db';
import { keyRing, syncRecord } from '../db/schema';
import app from '../main';

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
      encryptionAlgorithm: TEST_ALGORITHM,
      encryptionVersion: 1,
      iv: toBase64(TEST_IV),
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
      encryptionAlgorithm: TEST_ALGORITHM,
      encryptionVersion: 1,
      iv: toBase64(TEST_IV),
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
      encryptionVersion: 1,
      encryptionAlgorithm: TEST_ALGORITHM,
      iv: new Uint8Array(12),
      ciphertext: new Uint8Array(16),
    })
    .onConflictDoNothing();
}

describe('GET /api/sync', () => {
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
    const res = await syncRequest('/api/sync', {
      headers: syncHeaders(),
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ code: 'unauthorized' });
  });

  it('returns 400 when X-Local-User-Id is missing', async () => {
    const res = await syncRequest('/api/sync');
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ code: 'missing_local_user_id' });
  });

  it('returns 409 when X-Local-User-Id mismatches session user', async () => {
    const res = await syncRequest('/api/sync', {
      headers: { 'X-Local-User-Id': 'other-user' },
    });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ code: 'local_user_mismatch' });
  });

  it('returns JSON records array with ETag', async () => {
    await authHeaders(); // ensure user exists
    await insertTestKeyRing();
    const ciphertexts = [
      makeCiphertext([1]),
      makeCiphertext([2]),
      makeCiphertext([3]),
    ];
    for (let i = 0; i < 3; i++) {
      await syncRequest('/api/sync', pushBody(ciphertexts[i]));
    }

    const res = await syncRequest('/api/sync', { headers: syncHeaders() });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    expect(res.headers.get('ETag')).toBe('"3"');

    const rawBody: unknown = await res.json();
    const body = rawBody as {
      records: Array<{
        seq: number;
        kind: string;
        encryptionKeyId: string;
        encryptionAlgorithm: string;
        encryptionVersion: number;
        iv: string;
        ciphertext: string;
      }>;
    };
    expect(body.records).toHaveLength(3);
    expect(body.records[0].seq).toBe(1);
    expect(body.records[0].kind).toBe('update');
    expect(body.records[0].encryptionKeyId).toBe(TEST_KEY_ID);
    expect(body.records[0].encryptionAlgorithm).toBe(TEST_ALGORITHM);
    expect(body.records[0].encryptionVersion).toBe(1);
    expect(body.records[0].iv).toBe(toBase64(TEST_IV));
    expect(body.records[0].ciphertext).toBe(toBase64(ciphertexts[0]));
    expect(body.records[1].seq).toBe(2);
    expect(body.records[2].seq).toBe(3);
  });

  it('returns 304 when If-None-Match matches head', async () => {
    await authHeaders();
    await insertTestKeyRing();
    for (let i = 0; i < 3; i++) {
      await syncRequest('/api/sync', pushBody(makeCiphertext([i])));
    }

    const res = await syncRequest('/api/sync', {
      headers: syncHeaders({ 'If-None-Match': '"3"' }),
    });
    expect(res.status).toBe(304);
    expect(res.headers.get('ETag')).toBe('"3"');
  });

  it('returns full records when no If-None-Match header', async () => {
    await authHeaders();
    await insertTestKeyRing();
    for (let i = 0; i < 2; i++) {
      await syncRequest('/api/sync', pushBody(makeCiphertext([i])));
    }

    const res = await syncRequest('/api/sync', { headers: syncHeaders() });
    expect(res.status).toBe(200);
    const rawBody: unknown = await res.json();
    const body = rawBody as { records: unknown[] };
    expect(body.records).toHaveLength(2);
  });

  it('returns 410 when cursor is newer than head', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const res = await syncRequest('/api/sync', {
      headers: syncHeaders({ 'If-None-Match': '"999"' }),
    });
    expect(res.status).toBe(410);
  });

  it('returns empty records with ETag "0" when no records exist', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const res = await syncRequest('/api/sync', { headers: syncHeaders() });
    expect(res.status).toBe(200);
    expect(res.headers.get('ETag')).toBe('"0"');
    const rawBody: unknown = await res.json();
    const body = rawBody as { records: unknown[] };
    expect(body.records).toHaveLength(0);
  });
});

describe('POST /api/sync', () => {
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
    const res = await syncRequest('/api/sync', {
      method: 'POST',
      headers: syncHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        id: 'uuid-1',
        encryptionKeyId: TEST_KEY_ID,
        encryptionAlgorithm: TEST_ALGORITHM,
        encryptionVersion: 1,
        iv: toBase64(TEST_IV),
        ciphertext: toBase64(makeCiphertext([1])),
      }),
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ code: 'unauthorized' });
  });

  it('returns 400 for missing or invalid body fields', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const res = await syncRequest('/api/sync', {
      method: 'POST',
      headers: syncHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ ciphertext: toBase64(makeCiphertext([1])) }), // missing id and encryptionKeyId
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-UUID frontend-provided ids', async () => {
    await authHeaders();
    await insertTestKeyRing();

    const invalidRecordId = await syncRequest(
      '/api/sync',
      pushBody(makeCiphertext([1]), 'not-a-uuid'),
    );
    expect(invalidRecordId.status).toBe(400);

    const invalidKeyId = await syncRequest('/api/sync', {
      method: 'POST',
      headers: syncHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        id: crypto.randomUUID(),
        encryptionKeyId: 'not-a-uuid',
        encryptionAlgorithm: TEST_ALGORITHM,
        encryptionVersion: 1,
        iv: toBase64(TEST_IV),
        ciphertext: toBase64(makeCiphertext([1])),
      }),
    });
    expect(invalidKeyId.status).toBe(400);
  });

  it('assigns sequential seq and returns ETag', async () => {
    await authHeaders();
    await insertTestKeyRing();

    const r1 = await syncRequest('/api/sync', pushBody(makeCiphertext([1])));
    expect(r1.status).toBe(200);
    expect(r1.headers.get('ETag')).toBe('"1"');

    const r2 = await syncRequest('/api/sync', pushBody(makeCiphertext([2])));
    expect(r2.status).toBe(200);
    expect(r2.headers.get('ETag')).toBe('"2"');
  });

  it('idempotent duplicate returns same ETag', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const id = crypto.randomUUID();
    const ciphertext = makeCiphertext([42]);

    const r1 = await syncRequest('/api/sync', pushBody(ciphertext, id));
    expect(r1.status).toBe(200);
    expect(r1.headers.get('ETag')).toBe('"1"');

    const r2 = await syncRequest('/api/sync', pushBody(ciphertext, id));
    expect(r2.status).toBe(200);
    expect(r2.headers.get('ETag')).toBe('"1"');
  });

  it('same id different ciphertext returns 409', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const id = crypto.randomUUID();

    const r1 = await syncRequest(
      '/api/sync',
      pushBody(makeCiphertext([1]), id),
    );
    expect(r1.status).toBe(200);

    const r2 = await syncRequest(
      '/api/sync',
      pushBody(makeCiphertext([2]), id),
    );
    expect(r2.status).toBe(409);
    expect(await r2.json()).toEqual({ code: 'idempotency_conflict' });
  });

  it('emits X-Compact-Hint when over soft cap rows', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const ciphertext = makeCiphertext([1]);
    for (let i = 0; i < 200; i++) {
      await syncRequest('/api/sync', pushBody(ciphertext));
    }

    const res = await syncRequest('/api/sync', pushBody(ciphertext));

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Compact-Hint')).toBe('please');
  }, 15000);

  it('returns 413 when hard cap exceeded', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const ciphertext = new Uint8Array(1024 * 1024);
    for (let i = 0; i < 4; i++) {
      await syncRequest('/api/sync', pushBody(ciphertext));
    }

    const res = await syncRequest('/api/sync', pushBody(makeCiphertext([1])));
    expect(res.status).toBe(413);
  });

  it('returns 413 when single ciphertext exceeds MAX_CIPHERTEXT_BYTES', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const oversized = new Uint8Array(1024 * 1024 + 17);

    const res = await syncRequest('/api/sync', pushBody(oversized));
    expect(res.status).toBe(413);
  });

  it('returns 409 write_conflict when encryptionKeyId does not match active DEK at write time', async () => {
    await authHeaders();
    await insertTestKeyRing();

    const wrongKeyId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const res = await syncRequest('/api/sync', {
      method: 'POST',
      headers: syncHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        id: crypto.randomUUID(),
        encryptionKeyId: wrongKeyId,
        encryptionAlgorithm: TEST_ALGORITHM,
        encryptionVersion: 1,
        iv: toBase64(TEST_IV),
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

    const res = await syncRequest('/api/sync', pushBody(makeCiphertext([1])));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ code: 'write_conflict' });
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

  it('inserts snapshot and returns ETag', async () => {
    await authHeaders();
    await insertTestKeyRing();
    for (let i = 0; i < 5; i++) {
      await syncRequest('/api/sync', pushBody(makeCiphertext([i])));
    }

    const res = await syncRequest(
      '/api/sync/compact',
      compactBody(makeCiphertext([99]), 5),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('ETag')).toBe('"6"');
  });

  it('idempotent repeat returns same ETag without re-inserting', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const id = crypto.randomUUID();

    const r1 = await syncRequest(
      '/api/sync/compact',
      compactBody(makeCiphertext([99]), 0, id),
    );
    expect(r1.status).toBe(200);
    const etag1 = r1.headers.get('ETag');

    const r2 = await syncRequest(
      '/api/sync/compact',
      compactBody(makeCiphertext([99]), 0, id),
    );
    expect(r2.status).toBe(200);
    expect(r2.headers.get('ETag')).toBe(etag1);

    const getRes = await syncRequest('/api/sync', { headers: syncHeaders() });
    const rawBody: unknown = await getRes.json();
    const body = rawBody as { records: Array<{ kind: string }> };
    const snapshots = body.records.filter((r) => r.kind === 'snapshot');
    expect(snapshots).toHaveLength(1);
  });

  it('returns 409 when X-Replaces-Up-To exceeds head', async () => {
    await authHeaders();
    await insertTestKeyRing();
    for (let i = 0; i < 3; i++) {
      await syncRequest('/api/sync', pushBody(makeCiphertext([i])));
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
        encryptionVersion: 1,
        iv: toBase64(TEST_IV),
        ciphertext: toBase64(makeCiphertext([99])),
      }),
    });
    expect(res.status).toBe(400);
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
        encryptionVersion: 1,
        iv: toBase64(TEST_IV),
        ciphertext: toBase64(makeCiphertext([99])),
      }),
    });
    expect(invalidKeyId.status).toBe(400);
  });

  it('keeps tail within COMPACT_TAIL_MAX_ROWS and COMPACT_TAIL_MAX_BYTES', async () => {
    await authHeaders();
    await insertTestKeyRing();
    const ciphertext = new Uint8Array(60 * 1024);
    for (let i = 0; i < 50; i++) {
      await syncRequest('/api/sync', pushBody(ciphertext));
    }

    const compactRes = await syncRequest(
      '/api/sync/compact',
      compactBody(makeCiphertext([99]), 50),
    );
    expect(compactRes.status).toBe(200);

    const getRes = await syncRequest('/api/sync', { headers: syncHeaders() });
    const rawBody2: unknown = await getRes.json();
    const body = rawBody2 as {
      records: Array<{ kind: string; ciphertext: string }>;
    };

    const tailRecords = body.records.filter((r) => r.kind === 'update');
    expect(tailRecords.length).toBeLessThanOrEqual(50);

    const totalTailBytes = tailRecords.reduce((sum, r) => {
      return sum + atob(r.ciphertext).length;
    }, 0);
    expect(totalTailBytes).toBeLessThanOrEqual(256 * 1024);
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
      await syncRequest('/api/sync', pushBody(makeCiphertext([i])));
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
        encryptionAlgorithm: TEST_ALGORITHM,
        encryptionVersion: 1,
        iv: toBase64(TEST_IV),
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
      await syncRequest('/api/sync', pushBody(makeCiphertext([i])));
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
