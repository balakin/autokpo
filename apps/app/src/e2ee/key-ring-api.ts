import type {
  ChangeMasterPasswordRequest,
  CreateKeyRingProfileRequest,
  SerializedKeyRingProfile,
} from './key-ring-record';
import { isSerializedKeyRingProfile } from './key-ring-record';

export class KeyRingNotFoundError extends Error {
  constructor() {
    super('Key ring not found');
    this.name = 'KeyRingNotFoundError';
  }
}

export class KeyRingConflictError extends Error {
  constructor() {
    super('Key ring conflict');
    this.name = 'KeyRingConflictError';
  }
}

export async function createKeyRingProfile(
  request: CreateKeyRingProfileRequest,
): Promise<SerializedKeyRingProfile> {
  const response = await fetch('/api/e2ee/key-ring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return decodeKeyRingResponse(response);
}

export async function fetchKeyRingProfile(): Promise<SerializedKeyRingProfile> {
  const response = await fetch('/api/e2ee/key-ring');
  return decodeKeyRingResponse(response);
}

export async function changeMasterPassword(
  request: ChangeMasterPasswordRequest,
): Promise<void> {
  const response = await fetch('/api/e2ee/key-ring/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (response.status === 409) {
    throw new KeyRingConflictError();
  }
  if (!response.ok) {
    throw new Error(`Key ring request failed: ${response.status}`);
  }
}

async function decodeKeyRingResponse(
  response: Response,
): Promise<SerializedKeyRingProfile> {
  if (response.status === 404) {
    throw new KeyRingNotFoundError();
  }
  if (!response.ok) {
    throw new Error(`Key ring request failed: ${response.status}`);
  }
  const value: unknown = await response.json();
  if (!isSerializedKeyRingProfile(value)) {
    throw new Error('Invalid key ring response');
  }
  return value;
}
