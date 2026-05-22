import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import { bytesToBase64 } from '../../e2ee/base64';
import {
  pull,
  push,
  compact,
  SyncGoneError,
  type SyncRecord,
} from '../sync-client';

const SYNC_BASE = '/api/sync';

function makeFakeJsonResponse(
  body: unknown,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name: string) {
        return headers[name] ?? null;
      },
    },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function makeFakeEmptyResponse(
  status: number,
  headers: Record<string, string> = {},
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name: string) {
        return headers[name] ?? null;
      },
    },
    json: () => Promise.resolve(null),
  } as unknown as Response;
}

const TEST_IV = new Uint8Array(12).fill(0xab);
const TEST_ALGORITHM = 'aes-256-gcm';

function buildJsonRecords(
  records: Array<{
    seq: number;
    kind: 'update' | 'snapshot';
    encryptionKeyId: string;
    encryptionAlgorithm?: 'aes-256-gcm';
    ciphertext: Uint8Array;
    encryptionVersion?: number;
    iv?: Uint8Array;
  }>,
) {
  return records.map((r) => ({
    seq: r.seq,
    kind: r.kind,
    encryptionKeyId: r.encryptionKeyId,
    encryptionAlgorithm: r.encryptionAlgorithm ?? TEST_ALGORITHM,
    encryptionVersion: r.encryptionVersion ?? 1,
    iv: bytesToBase64(r.iv ?? TEST_IV),
    ciphertext: bytesToBase64(r.ciphertext),
  }));
}

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
      makeFakeEmptyResponse(304, { ETag: '"10"' }),
    );
    await pull({ since: 10, localUserId: 'user-1' });
    expect(mockFetch).toHaveBeenCalledWith(SYNC_BASE, {
      headers: { 'X-Local-User-Id': 'user-1', 'If-None-Match': '"10"' },
    });
  });

  it('does not send If-None-Match header when cursor is 0', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeEmptyResponse(304, { ETag: '"0"' }),
    );
    await pull({ since: 0, localUserId: 'user-1' });
    const call = mockFetch.mock.calls[0] as [string, RequestInit?];
    expect(call[1]?.headers).toEqual({ 'X-Local-User-Id': 'user-1' });
  });

  it('returns empty records and head on 304', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeEmptyResponse(304, { ETag: '"42"' }),
    );
    const result = await pull({ since: 41, localUserId: 'user-1' });
    expect(result).toEqual({ records: [], head: 42, status: 304 });
  });

  it('throws SyncGoneError on 410', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(makeFakeEmptyResponse(410));
    await expect(pull({ since: 5, localUserId: 'user-1' })).rejects.toThrow(
      SyncGoneError,
    );
  });

  it('parses JSON record array on 200 and base64-decodes ciphertexts', async () => {
    const mockFetch = vi.mocked(fetch);
    const ciphertext1 = new Uint8Array([0xaa, 0xbb]);
    const ciphertext2 = new Uint8Array([0xcc]);
    mockFetch.mockResolvedValueOnce(
      makeFakeJsonResponse(
        {
          records: buildJsonRecords([
            {
              seq: 3,
              kind: 'update',
              encryptionKeyId: 'key-1',
              ciphertext: ciphertext1,
            },
            {
              seq: 4,
              kind: 'snapshot',
              encryptionKeyId: 'key-1',
              ciphertext: ciphertext2,
            },
          ]),
        },
        200,
        { ETag: '"5"' },
      ),
    );
    const result = await pull({ since: 2, localUserId: 'user-1' });
    expect(result.head).toBe(5);
    expect(result.status).toBe(200);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toMatchObject<SyncRecord>({
      seq: 3,
      kind: 'update',
      encryptionKeyId: 'key-1',
      encryptionAlgorithm: TEST_ALGORITHM,
      encryptionVersion: 1,
      iv: TEST_IV,
      ciphertext: ciphertext1,
    });
    expect(result.records[1]).toMatchObject<SyncRecord>({
      seq: 4,
      kind: 'snapshot',
      encryptionKeyId: 'key-1',
      encryptionAlgorithm: TEST_ALGORITHM,
      encryptionVersion: 1,
      iv: TEST_IV,
      ciphertext: ciphertext2,
    });
  });

  it('returns empty records with head=0 on empty 200 JSON response', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeJsonResponse({ records: [] }, 200, { ETag: '"0"' }),
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

  it('sends JSON body with id, encryptionKeyId, encryptionAlgorithm, encryptionVersion, iv, and base64 ciphertext', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeEmptyResponse(200, { ETag: '"7"' }),
    );
    const delta = new Uint8Array([1, 2, 3]);
    await push({
      delta,
      id: 'test-uuid-123',
      encryptionKeyId: 'key-1',
      encryptionAlgorithm: TEST_ALGORITHM,
      encryptionVersion: 1,
      iv: TEST_IV,
      localUserId: 'user-1',
    });
    const call = mockFetch.mock.calls[0] as [string, RequestInit?];
    expect(call[1]?.headers).toMatchObject({
      'Content-Type': 'application/json',
    });
    expect(call[1]?.headers).not.toHaveProperty('Idempotency-Key');
    const body = JSON.parse(call[1]?.body as string) as {
      id: string;
      encryptionKeyId: string;
      encryptionAlgorithm: string;
      encryptionVersion: number;
      iv: string;
      ciphertext: string;
    };
    expect(body.id).toBe('test-uuid-123');
    expect(body.encryptionKeyId).toBe('key-1');
    expect(body.encryptionAlgorithm).toBe(TEST_ALGORITHM);
    expect(body.encryptionVersion).toBe(1);
    expect(body.iv).toBe(bytesToBase64(TEST_IV));
    expect(body.ciphertext).toBe(bytesToBase64(delta));
  });

  it('parses ETag response for assignedSeq', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeEmptyResponse(200, { ETag: '"15"' }),
    );
    const result = await push({
      delta: new Uint8Array([1]),
      id: 'uuid-1',
      encryptionKeyId: 'key-1',
      encryptionAlgorithm: TEST_ALGORITHM,
      encryptionVersion: 1,
      iv: TEST_IV,
      localUserId: 'user-1',
    });
    expect(result.assignedSeq).toBe(15);
  });

  it('detects X-Compact-Hint header', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeEmptyResponse(200, {
        ETag: '"8"',
        'X-Compact-Hint': 'please',
      }),
    );
    const result = await push({
      delta: new Uint8Array([1]),
      id: 'uuid-1',
      encryptionKeyId: 'key-1',
      encryptionAlgorithm: TEST_ALGORITHM,
      encryptionVersion: 1,
      iv: TEST_IV,
      localUserId: 'user-1',
    });
    expect(result.compactHint).toBe(true);
  });

  it('compactHint is false when header is absent', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeEmptyResponse(200, { ETag: '"3"' }),
    );
    const result = await push({
      delta: new Uint8Array([1]),
      id: 'uuid-1',
      encryptionKeyId: 'key-1',
      encryptionAlgorithm: TEST_ALGORITHM,
      encryptionVersion: 1,
      iv: TEST_IV,
      localUserId: 'user-1',
    });
    expect(result.compactHint).toBe(false);
  });

  it('throws Error on 413', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(makeFakeEmptyResponse(413));
    await expect(
      push({
        delta: new Uint8Array([1]),
        id: 'uuid-1',
        encryptionKeyId: 'key-1',
        encryptionAlgorithm: TEST_ALGORITHM,
        encryptionVersion: 1,
        iv: TEST_IV,
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

  it('sends JSON body with id, encryptionKeyId, encryptionAlgorithm, encryptionVersion, iv, and base64 snapshot', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeEmptyResponse(200, { ETag: '"12"' }),
    );
    const snapshot = new Uint8Array([0x01, 0x02]);
    await compact({
      snapshot,
      replacesUpTo: 10,
      id: 'compact-uuid-abc',
      encryptionKeyId: 'key-1',
      encryptionAlgorithm: TEST_ALGORITHM,
      encryptionVersion: 1,
      iv: TEST_IV,
      localUserId: 'user-1',
    });
    const call = mockFetch.mock.calls[0] as [string, RequestInit?];
    expect(call[1]?.headers).toMatchObject({
      'Content-Type': 'application/json',
      'X-Replaces-Up-To': '10',
    });
    expect(call[1]?.headers).not.toHaveProperty('Idempotency-Key');
    const body = JSON.parse(call[1]?.body as string) as {
      id: string;
      encryptionKeyId: string;
      encryptionAlgorithm: string;
      encryptionVersion: number;
      iv: string;
      ciphertext: string;
    };
    expect(body.id).toBe('compact-uuid-abc');
    expect(body.encryptionKeyId).toBe('key-1');
    expect(body.encryptionAlgorithm).toBe(TEST_ALGORITHM);
    expect(body.encryptionVersion).toBe(1);
    expect(body.iv).toBe(bytesToBase64(TEST_IV));
    expect(body.ciphertext).toBe(bytesToBase64(snapshot));
  });

  it('parses ETag for assignedSeq', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      makeFakeEmptyResponse(200, { ETag: '"20"' }),
    );
    const result = await compact({
      snapshot: new Uint8Array([1]),
      replacesUpTo: 15,
      id: 'uuid-1',
      encryptionKeyId: 'key-1',
      encryptionAlgorithm: TEST_ALGORITHM,
      encryptionVersion: 1,
      iv: TEST_IV,
      localUserId: 'user-1',
    });
    expect(result.assignedSeq).toBe(20);
  });

  it('throws Error on non-ok status', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(makeFakeEmptyResponse(500));
    await expect(
      compact({
        snapshot: new Uint8Array([1]),
        replacesUpTo: 5,
        id: 'uuid-1',
        encryptionKeyId: 'key-1',
        encryptionAlgorithm: TEST_ALGORITHM,
        encryptionVersion: 1,
        iv: TEST_IV,
        localUserId: 'user-1',
      }),
    ).rejects.toThrow('compact failed: 500');
  });
});
