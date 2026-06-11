import { base64ToBytes, bytesToBase64 } from '../e2ee/base64';

const SYNC_BASE = '/api/sync';

export interface SyncRecord {
  id: string;
  seq: number;
  kind: 'update' | 'snapshot';
  encryptionKeyId: string;
  keyRingRevision: number;
  encryptionAlgorithm: 'aes-256-gcm';
  encryptionParams: { iv: Uint8Array; tagBits: number };
  ciphertext: Uint8Array;
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
  const res = await fetch(`${SYNC_BASE}?since=${since}`, {
    headers: { 'X-Local-User-Id': localUserId },
  });
  if (res.status === 410) {
    throw new SyncGoneError();
  }
  if (!res.ok) {
    throw await parseError(res, 'pull failed');
  }
  const body = (await res.json()) as {
    head: number;
    records: Array<{
      seq: number;
      id: string;
      kind: 'update' | 'snapshot';
      encryptionKeyId: string;
      keyRingRevision: number;
      encryptionAlgorithm: 'aes-256-gcm';
      encryptionParams: { iv: string; tagBits: number };
      ciphertext: string;
    }>;
  };
  const records: SyncRecord[] = body.records.map((r) => ({
    id: r.id,
    seq: r.seq,
    kind: r.kind,
    encryptionKeyId: r.encryptionKeyId,
    keyRingRevision: r.keyRingRevision,
    encryptionAlgorithm: r.encryptionAlgorithm,
    encryptionParams: {
      iv: base64ToBytes(r.encryptionParams.iv),
      tagBits: r.encryptionParams.tagBits,
    },
    ciphertext: base64ToBytes(r.ciphertext),
  }));
  return { records, head: body.head, status: 200 };
}

export async function push({
  delta,
  id,
  encryptionKeyId,
  keyRingRevision,
  encryptionAlgorithm,
  encryptionParams,
  localUserId,
}: {
  delta: Uint8Array;
  id: string;
  encryptionKeyId: string;
  keyRingRevision: number;
  encryptionAlgorithm: 'aes-256-gcm';
  encryptionParams: { iv: Uint8Array; tagBits: number };
  localUserId: string;
}): Promise<{ assignedSeq: number; compactHint: boolean }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Local-User-Id': localUserId,
  };

  const res = await fetch(SYNC_BASE, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id,
      encryptionKeyId,
      keyRingRevision,
      encryptionAlgorithm,
      encryptionParams: {
        iv: bytesToBase64(encryptionParams.iv),
        tagBits: encryptionParams.tagBits,
      },
      ciphertext: bytesToBase64(delta),
    }),
  });
  if (res.status === 413) {
    throw new SyncRequestError(413, null, 'hard cap exceeded');
  }
  if (!res.ok) {
    throw await parseError(res, 'push failed');
  }
  const body = (await res.json()) as {
    assignedSeq: number;
    compactHint: boolean;
  };
  return { assignedSeq: body.assignedSeq, compactHint: body.compactHint };
}

export async function compact({
  snapshot,
  replacesUpTo,
  id,
  encryptionKeyId,
  keyRingRevision,
  encryptionAlgorithm,
  encryptionParams,
  localUserId,
}: {
  snapshot: Uint8Array;
  replacesUpTo: number;
  id: string;
  encryptionKeyId: string;
  keyRingRevision: number;
  encryptionAlgorithm: 'aes-256-gcm';
  encryptionParams: { iv: Uint8Array; tagBits: number };
  localUserId: string;
}): Promise<{ assignedSeq: number }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Replaces-Up-To': String(replacesUpTo),
    'X-Local-User-Id': localUserId,
  };

  const res = await fetch(`${SYNC_BASE}/compact`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id,
      encryptionKeyId,
      keyRingRevision,
      encryptionAlgorithm,
      encryptionParams: {
        iv: bytesToBase64(encryptionParams.iv),
        tagBits: encryptionParams.tagBits,
      },
      ciphertext: bytesToBase64(snapshot),
    }),
  });
  if (!res.ok) {
    throw await parseError(res, 'compact failed');
  }
  const body = (await res.json()) as { assignedSeq: number };
  return { assignedSeq: body.assignedSeq };
}
