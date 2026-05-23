import { afterEach, describe, expect, it } from 'vitest';

import { clearAuthData, workerTestEnv } from '../../tests/worker/auth-helpers';
import {
  makeAuthHeaders,
  mergeHeaders,
  mockCtx,
  type SessionState,
} from '../../tests/worker/request-helpers';
import app from '../main';

const sessionState: SessionState = { userId: 'e2ee-user-1', headers: null };
const authHeaders = makeAuthHeaders(sessionState);

function bytesBase64(length: number): string {
  return new Uint8Array(length).fill(1).toBase64();
}

function validPayload() {
  return {
    keyRingId: '11111111-1111-4111-8111-111111111111',
    wrappingId: '22222222-2222-4222-8222-222222222222',
    activeDekId: '33333333-3333-4333-8333-333333333333',
    encryptionVersion: 1,
    encryptionAlgorithm: 'aes-256-gcm',
    keyRingIv: bytesBase64(12),
    keyRingCiphertext: bytesBase64(48),
    kdfVersion: 1,
    kdfAlgorithm: 'argon2id',
    kdfParams: {
      memorySize: 65536,
      iterations: 3,
      parallelism: 1,
      hashLength: 32,
    },
    kdfSalt: bytesBase64(16),
    wrappingVersion: 1,
    wrappingAlgorithm: 'aes-256-gcm',
    wrappingParams: { ivBytes: 12, tagBits: 128 },
    wrappingIv: bytesBase64(12),
    ciphertext: bytesBase64(48),
  };
}

async function req(path: string, init?: RequestInit) {
  return app.request(
    `http://localhost${path}`,
    {
      ...init,
      headers: mergeHeaders(init?.headers, await authHeaders()),
    },
    workerTestEnv,
    mockCtx,
  );
}

describe('/api/e2ee/key-ring', () => {
  afterEach(async () => {
    sessionState.userId = 'e2ee-user-1';
    sessionState.headers = null;
    await clearAuthData();
  });

  it('returns 401 without an authenticated session', async () => {
    sessionState.userId = null;
    const res = await req('/api/e2ee/key-ring');
    expect(res.status).toBe(401);
  });

  it('returns 404 when no active key ring exists', async () => {
    const res = await req('/api/e2ee/key-ring');
    expect(res.status).toBe(404);
  });

  it('creates and retrieves the active password wrapper', async () => {
    const payload = validPayload();
    const create = await req('/api/e2ee/key-ring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(create.status).toBe(201);
    const created = await create.json();
    expect(created).toMatchObject({
      keyRing: {
        id: payload.keyRingId,
        userId: 'e2ee-user-1',
        activeDekId: payload.activeDekId,
      },
      wrappers: [
        expect.objectContaining({
          id: payload.wrappingId,
          userId: 'e2ee-user-1',
          method: 'password',
        }),
      ],
    });

    const get = await req('/api/e2ee/key-ring');
    expect(get.status).toBe(200);
    expect(await get.json()).toEqual(created);
  });

  it('rejects duplicate active setup', async () => {
    const payload = validPayload();
    await req('/api/e2ee/key-ring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const duplicate = await req('/api/e2ee/key-ring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validPayload(),
        keyRingId: crypto.randomUUID(),
      }),
    });

    expect(duplicate.status).toBe(409);
  });

  it('rejects invalid payloads', async () => {
    const res = await req('/api/e2ee/key-ring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload(), kdfSalt: bytesBase64(8) }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects frontend-provided IDs that are not UUIDs', async () => {
    for (const field of ['keyRingId', 'wrappingId', 'activeDekId'] as const) {
      const res = await req('/api/e2ee/key-ring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validPayload(), [field]: 'not-a-uuid' }),
      });

      expect(res.status).toBe(400);
    }
  });
});
