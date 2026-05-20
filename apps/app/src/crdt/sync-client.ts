const SYNC_BASE = '/api/sync';

export interface SyncRecord {
  seq: number;
  kind: number;
  bytes: Uint8Array;
}

export class SyncGoneError extends Error {
  status = 410;
}

export class SyncRequestError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function parseError(
  res: Response,
  fallback: string,
): Promise<SyncRequestError> {
  let code: string | null = null;
  try {
    const body = (await res.json()) as { code?: string };
    code = body.code ?? null;
  } catch {
    // code remains null
  }
  return new SyncRequestError(res.status, code, `${fallback}: ${res.status}`);
}

export async function pull({
  since,
  localUserId,
}: {
  since: number;
  localUserId: string;
}): Promise<{ records: SyncRecord[]; head: number; status: number }> {
  const headers: HeadersInit = { 'X-Local-User-Id': localUserId };
  if (since > 0) {
    headers['If-None-Match'] = `"${since}"`;
  }
  const res = await fetch(SYNC_BASE, { headers });
  if (res.status === 410) {
    throw new SyncGoneError();
  }
  if (res.status === 304) {
    return { records: [], head: parseETag(res.headers), status: 304 };
  }
  if (!res.ok) {
    throw await parseError(res, 'pull failed');
  }
  const head = parseETag(res.headers);
  const buf = await res.arrayBuffer();
  const records = parseRecordStream(buf);
  return { records, head, status: 200 };
}

export async function push({
  delta,
  idempotencyKey,
  localUserId,
}: {
  delta: Uint8Array<ArrayBuffer>;
  idempotencyKey: string;
  localUserId: string;
}): Promise<{ assignedSeq: number; compactHint: boolean }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
    'Content-Length': String(delta.byteLength),
    'Idempotency-Key': idempotencyKey,
    'X-Local-User-Id': localUserId,
  };

  const res = await fetch(SYNC_BASE, {
    method: 'POST',
    headers,
    body: delta,
  });
  if (res.status === 413) {
    throw new SyncRequestError(413, null, 'hard cap exceeded');
  }
  if (!res.ok) {
    throw await parseError(res, 'push failed');
  }
  const assignedSeq = parseETag(res.headers);
  const compactHint = res.headers.get('X-Compact-Hint') === 'please';
  return { assignedSeq, compactHint };
}

export async function compact({
  snapshot,
  replacesUpTo,
  idempotencyKey,
  localUserId,
}: {
  snapshot: Uint8Array<ArrayBuffer>;
  replacesUpTo: number;
  idempotencyKey: string;
  localUserId: string;
}): Promise<{ assignedSeq: number }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
    'Content-Length': String(snapshot.byteLength),
    'Idempotency-Key': idempotencyKey,
    'X-Replaces-Up-To': String(replacesUpTo),
    'X-Local-User-Id': localUserId,
  };

  const res = await fetch(`${SYNC_BASE}/compact`, {
    method: 'POST',
    headers,
    body: snapshot,
  });
  if (!res.ok) {
    throw await parseError(res, 'compact failed');
  }
  return { assignedSeq: parseETag(res.headers) };
}

function parseETag(headers: Headers): number {
  return parseInt(headers.get('ETag')?.replace(/"/g, '') ?? '0', 10);
}

export function parseRecordStream(buf: ArrayBuffer): SyncRecord[] {
  const records: SyncRecord[] = [];
  const view = new DataView(buf);
  let offset = 0;
  while (offset + 9 <= buf.byteLength) {
    const seq = view.getUint32(offset);
    const kind = view.getUint8(offset + 4);
    const len = view.getUint32(offset + 5);
    if (offset + 9 + len > buf.byteLength) break;
    const bytes = new Uint8Array(buf.slice(offset + 9, offset + 9 + len));
    records.push({ seq, kind, bytes });
    offset += 9 + len;
  }
  return records;
}
