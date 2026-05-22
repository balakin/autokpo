import type {
  CreateEncryptionKeyRequest,
  SerializedEncryptionKeyRecord,
} from './encryption-key-record';
import { isSerializedEncryptionKeyRecord } from './encryption-key-record';

export class EncryptionKeyNotFoundError extends Error {
  constructor() {
    super('Encryption key not found');
    this.name = 'EncryptionKeyNotFoundError';
  }
}

export async function createEncryptionKeyRecord(
  request: CreateEncryptionKeyRequest,
): Promise<SerializedEncryptionKeyRecord> {
  const response = await fetch('/api/e2ee/key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return decodeEncryptionKeyResponse(response);
}

export async function fetchEncryptionKeyRecord(): Promise<SerializedEncryptionKeyRecord> {
  const response = await fetch('/api/e2ee/key');
  return decodeEncryptionKeyResponse(response);
}

async function decodeEncryptionKeyResponse(
  response: Response,
): Promise<SerializedEncryptionKeyRecord> {
  if (response.status === 404) {
    throw new EncryptionKeyNotFoundError();
  }
  if (!response.ok) {
    throw new Error(`Encryption key request failed: ${response.status}`);
  }
  const value: unknown = await response.json();
  if (!isSerializedEncryptionKeyRecord(value)) {
    throw new Error('Invalid encryption key response');
  }
  return value;
}
