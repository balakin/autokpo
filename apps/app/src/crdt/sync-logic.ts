import { aesGcmDecrypt, aesGcmEncrypt } from '../e2ee/aes-gcm';
import { AES_GCM_PARAMS_V1 } from '../e2ee/key-ring-record';

import type { ParsedSyncState } from './sync-state';
import type { TypedDoc } from './typed-doc';
import { applyUpdate, encodeStateAsUpdate } from './y';

export const REMOTE_ORIGIN = Symbol('autokpo:remote');

export function hasPendingChanges(state: ParsedSyncState): boolean {
  if (state.stateVector === null) return true;
  return state.dirty;
}

export function computeDelta(
  doc: TypedDoc,
  stateVector: Uint8Array | null,
): Uint8Array<ArrayBuffer> {
  return stateVector === null
    ? encodeStateAsUpdate(doc)
    : encodeStateAsUpdate(doc, stateVector);
}

export function applyRecordsToDoc(
  doc: TypedDoc,
  plaintexts: Uint8Array[],
): void {
  if (plaintexts.length === 0) return;
  doc.transact(() => {
    for (const bytes of plaintexts) {
      applyUpdate(doc, bytes, REMOTE_ORIGIN);
    }
  }, REMOTE_ORIGIN);
}

export function schedulePushIfPendingChanges(
  state: ParsedSyncState,
  schedulePush: () => void,
): void {
  if (hasPendingChanges(state)) {
    schedulePush();
  }
}

export interface EncryptedSyncPayload {
  encryptionAlgorithm: 'aes-256-gcm';
  encryptionParams: { iv: Uint8Array; tagBits: number };
  ciphertext: Uint8Array;
}

type SyncPayloadAadContext = {
  userId: string;
  activeDekId: string;
  keyRingRevision: number;
  blockId: string;
  kind: 'update' | 'snapshot';
};

type EncryptSyncPayloadInput = SyncPayloadAadContext & {
  plaintext: Uint8Array;
  activeDek: Uint8Array;
};

type DecryptSyncPayloadInput = SyncPayloadAadContext & {
  payload: EncryptedSyncPayload;
  activeDek: Uint8Array;
};

export async function encryptSyncPayload({
  plaintext,
  activeDek,
  userId,
  activeDekId,
  keyRingRevision,
  blockId,
  kind,
}: EncryptSyncPayloadInput): Promise<EncryptedSyncPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aad = buildAad({
    userId,
    activeDekId,
    keyRingRevision,
    blockId,
    kind,
  });
  const tagBits = AES_GCM_PARAMS_V1.tagBits;
  const ciphertext = await aesGcmEncrypt({
    keyBytes: activeDek,
    params: { iv, tagBits },
    plaintext,
    aad,
  });
  return {
    encryptionAlgorithm: 'aes-256-gcm',
    encryptionParams: { iv, tagBits },
    ciphertext,
  };
}

export async function decryptSyncPayload({
  payload: { encryptionAlgorithm, encryptionParams, ciphertext },
  activeDek,
  userId,
  activeDekId,
  keyRingRevision,
  blockId,
  kind,
}: DecryptSyncPayloadInput): Promise<Uint8Array> {
  if (encryptionAlgorithm !== 'aes-256-gcm') {
    throw new Error(
      `Unsupported encryption_algorithm: ${String(encryptionAlgorithm)}`,
    );
  }
  const aad = buildAad({
    userId,
    activeDekId,
    keyRingRevision,
    blockId,
    kind,
  });
  return aesGcmDecrypt({
    keyBytes: activeDek,
    params: encryptionParams,
    ciphertext,
    aad,
  });
}

function buildAad({
  userId,
  activeDekId,
  keyRingRevision,
  blockId,
  kind,
}: SyncPayloadAadContext): Uint8Array {
  return new TextEncoder().encode(
    `autokpo:e2ee-update:v1:${userId}:${activeDekId}:${keyRingRevision}:${blockId}:${kind}`,
  );
}
