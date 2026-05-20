import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import {
  pull,
  push,
  compact,
  SyncGoneError,
  parseRecordStream,
  type SyncRecord,
} from '../sync-client';

const SYNC_BASE = '/api/sync';

function makeFakeResponse(
  body: ArrayBuffer | null,
  status: number,
  headers: Record<string, string> = {},
): Response {
  const mockRes = {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name: string) {
        return headers[name] ?? null;
      },
    },
    arrayBuffer: () => body ?? new ArrayBuffer(0),
  } as unknown as Response;
  return mockRes;
}

function buildRecordStream(records: SyncRecord[]): ArrayBuffer {
  let totalSize = 0;
  for (const r of records) {
    totalSize += 9 + r.bytes.byteLength;
  }
  const buf = new ArrayBuffer(totalSize);
  const view = new DataView(buf);
  let offset = 0;
  for (const r of records) {
    view.setUint32(offset, r.seq);
    view.setUint8(offset + 4, r.kind);
    view.setUint32(offset + 5, r.bytes.byteLength);
    new Uint8Array(buf, offset + 9).set(r.bytes);
    offset += 9 + r.bytes.byteLength;
  }
  return buf;
}

describe('parseRecordStream', () => {
  it('parses a binary buffer with multiple records', () => {
    const records: SyncRecord[] = [
      { seq: 1, kind: 1, bytes: new Uint8Array([0x01]) },
      { seq: 2, kind: 2, bytes: new Uint8Array([0x02, 0x03]) },
      { seq: 3, kind: 1, bytes: new Uint8Array([0x04, 0x05, 0x06]) },
    ];
    const buf = buildRecordStream(records);
    const result = parseRecordStream(buf);
    expect(result).toEqual(records);
  });

  it('returns empty array for empty buffer', () => {
    expect(parseRecordStream(new ArrayBuffer(0))).toEqual([]);
  });

  it('handles single record', () => {
    const records = [{ seq: 5, kind: 1, bytes: new Uint8Array([0xfa]) }];
    const buf = buildRecordStream(records);
    const result = parseRecordStream(buf);
    expect(result).toEqual(records);
    expect(result[0].bytes.byteLength).toBe(1);
  });
});

describe('pull', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends If-None-Match header when cursor > 0', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeResponse(new ArrayBuffer(0), 304, { ETag: '"10"' }),
    );
    await pull({ since: 10, localUserId: 'user-1' });
    expect(mockFetch).toHaveBeenCalledWith(SYNC_BASE, {
      headers: { 'X-Local-User-Id': 'user-1', 'If-None-Match': '"10"' },
    });
  });

  it('does not send If-None-Match header when cursor is 0', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeResponse(new ArrayBuffer(0), 304, { ETag: '"0"' }),
    );
    await pull({ since: 0, localUserId: 'user-1' });
    const call = mockFetch.mock.calls[0] as [string, RequestInit?];
    expect(call[1]?.headers).toEqual({ 'X-Local-User-Id': 'user-1' });
  });

  it('returns empty records and head on 304', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeResponse(null, 304, { ETag: '"42"' }),
    );
    const result = await pull({ since: 41, localUserId: 'user-1' });
    expect(result).toEqual({ records: [], head: 42, status: 304 });
  });

  it('throws SyncGoneError on 410', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(makeFakeResponse(null, 410));
    await expect(pull({ since: 5, localUserId: 'user-1' })).rejects.toThrow(
      SyncGoneError,
    );
  });

  it('parses binary record stream on 200', async () => {
    const mockFetch = vi.mocked(fetch);
    const records: SyncRecord[] = [
      { seq: 3, kind: 1, bytes: new Uint8Array([0xaa, 0xbb]) },
      { seq: 4, kind: 2, bytes: new Uint8Array([0xcc]) },
    ];
    mockFetch.mockResolvedValueOnce(
      makeFakeResponse(buildRecordStream(records), 200, { ETag: '"5"' }),
    );
    const result = await pull({ since: 2, localUserId: 'user-1' });
    expect(result.head).toBe(5);
    expect(result.records).toEqual(records);
  });

  it('returns empty records with head=0 on empty 200 response', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeResponse(new ArrayBuffer(0), 200, { ETag: '"0"' }),
    );
    const result = await pull({ since: 0, localUserId: 'user-1' });
    expect(result).toEqual({ records: [], head: 0, status: 200 });
  });
});

describe('push', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends Idempotency-Key and Content-Length headers', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeResponse(null, 200, { ETag: '"7"' }),
    );
    const delta = new Uint8Array([1, 2, 3]);
    await push({
      delta,
      idempotencyKey: 'test-key-123',
      localUserId: 'user-1',
    });
    const call = mockFetch.mock.calls[0] as [string, RequestInit?];
    expect(call[1]?.headers).toMatchObject({
      'Idempotency-Key': 'test-key-123',
      'Content-Length': '3',
    });
  });

  it('parses ETag response for assignedSeq', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeResponse(null, 200, { ETag: '"15"' }),
    );
    const result = await push({
      delta: new Uint8Array([1]),
      idempotencyKey: 'key',
      localUserId: 'user-1',
    });
    expect(result.assignedSeq).toBe(15);
  });

  it('detects X-Compact-Hint header', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeResponse(null, 200, {
        ETag: '"8"',
        'X-Compact-Hint': 'please',
      }),
    );
    const result = await push({
      delta: new Uint8Array([1]),
      idempotencyKey: 'key',
      localUserId: 'user-1',
    });
    expect(result.compactHint).toBe(true);
  });

  it('compactHint is false when header is absent', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeResponse(null, 200, { ETag: '"3"' }),
    );
    const result = await push({
      delta: new Uint8Array([1]),
      idempotencyKey: 'key',
      localUserId: 'user-1',
    });
    expect(result.compactHint).toBe(false);
  });

  it('throws Error on 413', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(makeFakeResponse(null, 413));
    await expect(
      push({
        delta: new Uint8Array([1]),
        idempotencyKey: 'key',
        localUserId: 'user-1',
      }),
    ).rejects.toThrow('hard cap exceeded');
  });
});

describe('compact', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends X-Replaces-Up-To and Idempotency-Key headers', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeResponse(null, 200, { ETag: '"12"' }),
    );
    const snapshot = new Uint8Array([0x01, 0x02]);
    await compact({
      snapshot,
      replacesUpTo: 10,
      idempotencyKey: 'compact-key-abc',
      localUserId: 'user-1',
    });
    const call = mockFetch.mock.calls[0] as [string, RequestInit?];
    expect(call[1]?.headers).toMatchObject({
      'X-Replaces-Up-To': '10',
      'Idempotency-Key': 'compact-key-abc',
    });
  });

  it('parses ETag for assignedSeq', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeResponse(null, 200, { ETag: '"20"' }),
    );
    const result = await compact({
      snapshot: new Uint8Array([1]),
      replacesUpTo: 15,
      idempotencyKey: 'key',
      localUserId: 'user-1',
    });
    expect(result.assignedSeq).toBe(20);
  });

  it('throws Error on non-ok status', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(makeFakeResponse(null, 500));
    await expect(
      compact({
        snapshot: new Uint8Array([1]),
        replacesUpTo: 5,
        idempotencyKey: 'key',
        localUserId: 'user-1',
      }),
    ).rejects.toThrow('compact failed: 500');
  });
});
