import { afterEach, describe, expect, it } from 'vitest';

import { clearAuthData, workerTestEnv } from '../../tests/worker/auth-helpers';
import {
  makeAuthHeaders,
  mergeHeaders,
  mockCtx,
  type SessionState,
} from '../../tests/worker/request-helpers';
import app from '../main';

const sessionState: SessionState = { userId: 'user-1', headers: null };
const authHeaders = makeAuthHeaders(sessionState);

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

function parseBinaryStream(buffer: ArrayBuffer): Array<{
  seq: number;
  kind: number;
  bytes: Uint8Array;
}> {
  const records: Array<{ seq: number; kind: number; bytes: Uint8Array }> = [];
  const view = new DataView(buffer);
  let offset = 0;
  while (offset < buffer.byteLength) {
    const seq = view.getUint32(offset, false);
    offset += 4;
    const kind = view.getUint8(offset);
    offset += 1;
    const len = view.getUint32(offset, false);
    offset += 4;
    const bytes = new Uint8Array(buffer.slice(offset, offset + len));
    offset += len;
    records.push({ seq, kind, bytes });
  }
  return records;
}

function makeBlob(values: number[]): Uint8Array {
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

describe('GET /api/sync', () => {
  afterEach(async () => {
    sessionState.userId = 'user-1';
    sessionState.headers = null;
    await workerTestEnv.DB.exec('DELETE FROM updates');
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

  it('returns binary record stream with ETag', async () => {
    for (let i = 0; i < 3; i++) {
      await syncRequest('/api/sync', {
        method: 'POST',
        headers: syncHeaders({
          'Content-Type': 'application/octet-stream',
          'Idempotency-Key': `key-${i}`,
          'Content-Length': '1',
        }),
        body: makeBlob([i]),
      });
    }

    const res = await syncRequest('/api/sync', { headers: syncHeaders() });
    expect(res.status).toBe(200);
    expect(res.headers.get('ETag')).toBe('"3"');

    const buffer = await res.arrayBuffer();
    const records = parseBinaryStream(buffer);
    expect(records).toHaveLength(3);
    expect(records[0].seq).toBe(1);
    expect(records[0].kind).toBe(0x01);
    expect(records[1].seq).toBe(2);
    expect(records[2].seq).toBe(3);
  });

  it('returns 304 when If-None-Match matches head', async () => {
    for (let i = 0; i < 3; i++) {
      await syncRequest('/api/sync', {
        method: 'POST',
        headers: syncHeaders({
          'Content-Type': 'application/octet-stream',
          'Idempotency-Key': `key-full-${i}`,
          'Content-Length': '1',
        }),
        body: makeBlob([i]),
      });
    }

    const res = await syncRequest('/api/sync', {
      headers: syncHeaders({ 'If-None-Match': '"3"' }),
    });
    expect(res.status).toBe(304);
    expect(res.headers.get('ETag')).toBe('"3"');
  });

  it('returns full stream when no If-None-Match header', async () => {
    for (let i = 0; i < 2; i++) {
      await syncRequest('/api/sync', {
        method: 'POST',
        headers: syncHeaders({
          'Content-Type': 'application/octet-stream',
          'Idempotency-Key': `key-no-match-${i}`,
          'Content-Length': '1',
        }),
        body: makeBlob([i]),
      });
    }

    const res = await syncRequest('/api/sync', { headers: syncHeaders() });
    expect(res.status).toBe(200);
    const buffer = await res.arrayBuffer();
    const records = parseBinaryStream(buffer);
    expect(records).toHaveLength(2);
  });

  it('returns 410 when cursor is newer than head', async () => {
    const res = await syncRequest('/api/sync', {
      headers: syncHeaders({ 'If-None-Match': '"999"' }),
    });
    expect(res.status).toBe(410);
  });

  it('empty body with ETag "0" when no records', async () => {
    const res = await syncRequest('/api/sync', { headers: syncHeaders() });
    expect(res.status).toBe(200);
    expect(res.headers.get('ETag')).toBe('"0"');
    const ab = await res.arrayBuffer();
    expect(ab.byteLength).toBe(0);
  });
});

describe('POST /api/sync', () => {
  afterEach(async () => {
    sessionState.userId = 'user-1';
    sessionState.headers = null;
    await workerTestEnv.DB.exec('DELETE FROM updates');
    await clearAuthData();
  });

  it('returns 401 when request is unauthenticated', async () => {
    sessionState.userId = null;
    const res = await syncRequest('/api/sync', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/octet-stream',
        'Idempotency-Key': 'unauth',
        'Content-Length': '1',
      }),
      body: makeBlob([1]),
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ code: 'unauthorized' });
  });

  it('returns 400 when missing Idempotency-Key', async () => {
    const blob = makeBlob([1]);
    const res = await syncRequest('/api/sync', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(blob.byteLength),
      }),
      body: blob,
    });
    expect(res.status).toBe(400);
  });

  it('returns 415 for wrong Content-Type', async () => {
    const res = await syncRequest('/api/sync', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/json',
        'Idempotency-Key': 'key-415',
        'Content-Length': '1',
      }),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(415);
  });

  it('returns 413 when Content-Length exceeds MAX_BLOB_BYTES', async () => {
    const bigBody = new Uint8Array(1024 * 1024 + 1);
    const res = await syncRequest('/api/sync', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/octet-stream',
        'Idempotency-Key': 'key-big',
        'Content-Length': String(1024 * 1024 + 1),
      }),
      body: bigBody,
    });
    expect(res.status).toBe(413);
  });

  it('assigns sequential seq and returns ETag', async () => {
    const r1 = await syncRequest('/api/sync', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/octet-stream',
        'Idempotency-Key': 'seq-key-1',
        'Content-Length': '1',
      }),
      body: makeBlob([1]),
    });
    expect(r1.status).toBe(200);
    expect(r1.headers.get('ETag')).toBe('"1"');

    const r2 = await syncRequest('/api/sync', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/octet-stream',
        'Idempotency-Key': 'seq-key-2',
        'Content-Length': '1',
      }),
      body: makeBlob([2]),
    });
    expect(r2.status).toBe(200);
    expect(r2.headers.get('ETag')).toBe('"2"');
  });

  it('idempotent duplicate returns same ETag', async () => {
    const key = 'idempotent-dup-key';
    const blob = makeBlob([42]);

    const r1 = await syncRequest('/api/sync', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/octet-stream',
        'Idempotency-Key': key,
        'Content-Length': '1',
      }),
      body: blob,
    });
    expect(r1.status).toBe(200);
    expect(r1.headers.get('ETag')).toBe('"1"');

    const r2 = await syncRequest('/api/sync', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/octet-stream',
        'Idempotency-Key': key,
        'Content-Length': '1',
      }),
      body: blob,
    });
    expect(r2.status).toBe(200);
    expect(r2.headers.get('ETag')).toBe('"1"');
  });

  it('same key different blob returns 409', async () => {
    const key = 'key-conflict';
    const r1 = await syncRequest('/api/sync', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/octet-stream',
        'Idempotency-Key': key,
        'Content-Length': '1',
      }),
      body: makeBlob([1]),
    });
    expect(r1.status).toBe(200);

    const r2 = await syncRequest('/api/sync', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/octet-stream',
        'Idempotency-Key': key,
        'Content-Length': '1',
      }),
      body: makeBlob([2]),
    });
    expect(r2.status).toBe(409);
    expect(await r2.json()).toEqual({ code: 'idempotency_conflict' });
  });

  it('emits X-Compact-Hint when over soft cap rows', async () => {
    const blob = makeBlob([1]);
    for (let i = 0; i < 200; i++) {
      await syncRequest('/api/sync', {
        method: 'POST',
        headers: syncHeaders({
          'Content-Type': 'application/octet-stream',
          'Idempotency-Key': `soft-cap-key-${i}`,
          'Content-Length': '1',
        }),
        body: blob,
      });
    }

    const res = await syncRequest('/api/sync', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/octet-stream',
        'Idempotency-Key': 'soft-cap-last-key',
        'Content-Length': '1',
      }),
      body: blob,
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Compact-Hint')).toBe('please');
  });

  it('returns 413 when hard cap exceeded', async () => {
    const blob = new Uint8Array(1024 * 1024);
    for (let i = 0; i < 4; i++) {
      await syncRequest('/api/sync', {
        method: 'POST',
        headers: syncHeaders({
          'Content-Type': 'application/octet-stream',
          'Idempotency-Key': `hard-cap-key-${i}`,
          'Content-Length': String(blob.byteLength),
        }),
        body: blob,
      });
    }

    const res = await syncRequest('/api/sync', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/octet-stream',
        'Idempotency-Key': 'hard-cap-last-key',
        'Content-Length': '1',
      }),
      body: makeBlob([1]),
    });
    expect(res.status).toBe(413);
  });
});

describe('POST /api/sync/compact', () => {
  afterEach(async () => {
    sessionState.userId = 'user-1';
    sessionState.headers = null;
    await workerTestEnv.DB.exec('DELETE FROM updates');
    await clearAuthData();
  });

  it('inserts snapshot and returns ETag', async () => {
    for (let i = 0; i < 5; i++) {
      await syncRequest('/api/sync', {
        method: 'POST',
        headers: syncHeaders({
          'Content-Type': 'application/octet-stream',
          'Idempotency-Key': `compact-pre-${i}`,
          'Content-Length': '1',
        }),
        body: makeBlob([i]),
      });
    }

    const res = await syncRequest('/api/sync/compact', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/octet-stream',
        'Idempotency-Key': 'compact-key-1',
        'X-Replaces-Up-To': '5',
        'Content-Length': '1',
      }),
      body: makeBlob([99]),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('ETag')).toBe('"6"');
  });

  it('idempotent repeat returns same ETag without re-inserting', async () => {
    const key = 'compact-idempotent-key';

    const r1 = await syncRequest('/api/sync/compact', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/octet-stream',
        'Idempotency-Key': key,
        'X-Replaces-Up-To': '0',
        'Content-Length': '1',
      }),
      body: makeBlob([99]),
    });
    expect(r1.status).toBe(200);
    const etag1 = r1.headers.get('ETag');

    const r2 = await syncRequest('/api/sync/compact', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/octet-stream',
        'Idempotency-Key': key,
        'X-Replaces-Up-To': '0',
        'Content-Length': '1',
      }),
      body: makeBlob([99]),
    });
    expect(r2.status).toBe(200);
    expect(r2.headers.get('ETag')).toBe(etag1);

    const getRes = await syncRequest('/api/sync', { headers: syncHeaders() });
    const buffer = await getRes.arrayBuffer();
    const records = parseBinaryStream(buffer);
    const snapshots = records.filter((r) => r.kind === 0x02);
    expect(snapshots).toHaveLength(1);
  });

  it('returns 409 when X-Replaces-Up-To exceeds head', async () => {
    for (let i = 0; i < 3; i++) {
      await syncRequest('/api/sync', {
        method: 'POST',
        headers: syncHeaders({
          'Content-Type': 'application/octet-stream',
          'Idempotency-Key': `compact-future-pre-${i}`,
          'Content-Length': '1',
        }),
        body: makeBlob([i]),
      });
    }

    const res = await syncRequest('/api/sync/compact', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/octet-stream',
        'Idempotency-Key': 'compact-future-key',
        'X-Replaces-Up-To': '999',
        'Content-Length': '1',
      }),
      body: makeBlob([99]),
    });
    expect(res.status).toBe(409);
  });

  it('returns 400 for missing required headers', async () => {
    const res = await syncRequest('/api/sync/compact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': '1',
      },
      body: makeBlob([99]),
    });
    expect(res.status).toBe(400);
  });

  it('keeps tail within COMPACT_TAIL_MAX_ROWS and COMPACT_TAIL_MAX_BYTES', async () => {
    const blob = new Uint8Array(60 * 1024);
    for (let i = 0; i < 50; i++) {
      await syncRequest('/api/sync', {
        method: 'POST',
        headers: syncHeaders({
          'Content-Type': 'application/octet-stream',
          'Idempotency-Key': `compact-tail-pre-${i}`,
          'Content-Length': String(blob.byteLength),
        }),
        body: blob,
      });
    }

    const compactRes = await syncRequest('/api/sync/compact', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/octet-stream',
        'Idempotency-Key': 'compact-tail-key',
        'X-Replaces-Up-To': '50',
        'Content-Length': '1',
      }),
      body: makeBlob([99]),
    });
    expect(compactRes.status).toBe(200);

    const getRes = await syncRequest('/api/sync', { headers: syncHeaders() });
    const buffer = await getRes.arrayBuffer();
    const records = parseBinaryStream(buffer);

    const tailRecords = records.filter((r) => r.kind === 0x01);
    expect(tailRecords.length).toBeLessThanOrEqual(50);

    const totalTailBytes = tailRecords.reduce(
      (sum, r) => sum + r.bytes.byteLength,
      0,
    );
    expect(totalTailBytes).toBeLessThanOrEqual(256 * 1024);
  });

  it('binary body is accepted', async () => {
    const binaryBlob = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    const res = await syncRequest('/api/sync/compact', {
      method: 'POST',
      headers: syncHeaders({
        'Content-Type': 'application/octet-stream',
        'Idempotency-Key': 'compact-binary-key',
        'X-Replaces-Up-To': '0',
        'Content-Length': String(binaryBlob.byteLength),
      }),
      body: binaryBlob,
    });
    expect(res.status).toBe(200);
  });
});
