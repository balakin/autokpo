import { aesGcmDecrypt, aesGcmEncrypt } from '../e2ee/aes-gcm';

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

function buildAad(
  userId: string,
  keyId: string,
  kind: 'update' | 'snapshot',
): Uint8Array {
  return new TextEncoder().encode(
    `autokpo:e2ee-update:v1:${userId}:${keyId}:${kind}`,
  );
}

export interface EncryptedSyncPayload {
  encryptionAlgorithm: 'aes-256-gcm';
  encryptionVersion: 1;
  iv: Uint8Array;
  ciphertext: Uint8Array;
}

export async function encryptSyncPayload(
  plaintext: Uint8Array,
  masterKey: Uint8Array,
  userId: string,
  keyId: string,
  kind: 'update' | 'snapshot',
): Promise<EncryptedSyncPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aad = buildAad(userId, keyId, kind);
  const ciphertext = await aesGcmEncrypt({
    keyBytes: masterKey,
    iv,
    plaintext,
    aad,
  });
  return {
    encryptionAlgorithm: 'aes-256-gcm',
    encryptionVersion: 1,
    iv,
    ciphertext,
  };
}

export async function decryptSyncPayload(
  {
    encryptionAlgorithm,
    encryptionVersion,
    iv,
    ciphertext,
  }: EncryptedSyncPayload,
  masterKey: Uint8Array,
  userId: string,
  keyId: string,
  kind: 'update' | 'snapshot',
): Promise<Uint8Array> {
  if (encryptionAlgorithm !== 'aes-256-gcm') {
    throw new Error(
      `Unsupported encryption_algorithm: ${String(encryptionAlgorithm)}`,
    );
  }
  if (encryptionVersion !== 1) {
    throw new Error(
      `Unsupported encryption_version: ${String(encryptionVersion)}`,
    );
  }
  const aad = buildAad(userId, keyId, kind);
  return aesGcmDecrypt({ keyBytes: masterKey, iv, ciphertext, aad });
}
