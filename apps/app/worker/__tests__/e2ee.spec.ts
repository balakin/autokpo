import { and, eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';

import type { SerializedKeyRingProfile } from '../../src/e2ee/key-ring-record';
import { clearAuthData, workerTestEnv } from '../../tests/worker/auth-helpers';
import {
  makeAuthHeaders,
  mergeHeaders,
  mockCtx,
  type SessionState,
} from '../../tests/worker/request-helpers';
import { getDb } from '../db';
import { keyRing, keyRingWrapping } from '../db/schema';
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
    keyRing: {
      encryptionAlgorithm: 'aes-256-gcm',
      encryptionParams: { iv: bytesBase64(12), tagBits: 128 },
      ciphertext: bytesBase64(48),
    },
    mek: {
      kdfAlgorithm: 'argon2id',
      kdfParams: {
        memorySize: 65536,
        iterations: 3,
        parallelism: 1,
        hashLength: 32,
      },
      kdfSalt: bytesBase64(16),
      wrappingAlgorithm: 'aes-256-gcm',
      wrappingParams: { iv: bytesBase64(12), tagBits: 128 },
      ciphertext: bytesBase64(48),
    },
  };
}

function validChangePayload(currentWrappingId: string) {
  return {
    currentWrappingId,
    wrappingId: '44444444-4444-4444-8444-444444444444',
    kdfAlgorithm: 'argon2id',
    kdfParams: {
      memorySize: 65536,
      iterations: 3,
      parallelism: 1,
      hashLength: 32,
    },
    kdfSalt: bytesBase64(16),
    wrappingAlgorithm: 'aes-256-gcm',
    wrappingParams: { iv: bytesBase64(12), tagBits: 128 },
    ciphertext: bytesBase64(48),
  };
}

function validUpdatePayload(currentRevision: number) {
  return {
    currentRevision,
    activeDekId: '66666666-6666-4666-8666-666666666666',
    encryptionAlgorithm: 'aes-256-gcm',
    encryptionParams: { iv: bytesBase64(12), tagBits: 128 },
    ciphertext: bytesBase64(64),
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
        revision: 1,
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

  it('atomic setup: duplicate setup leaves only original key ring and wrapper', async () => {
    const first = validPayload();
    await req('/api/e2ee/key-ring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(first),
    });

    const second = { ...validPayload(), keyRingId: crypto.randomUUID() };
    await req('/api/e2ee/key-ring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(second),
    });

    const db = getDb(workerTestEnv.DB);
    const keyRings = await db
      .select()
      .from(keyRing)
      .where(eq(keyRing.userId, 'e2ee-user-1'));
    expect(keyRings).toHaveLength(1);
    expect(keyRings[0].id).toBe(first.keyRingId);

    const wrappers = await db
      .select()
      .from(keyRingWrapping)
      .where(eq(keyRingWrapping.userId, 'e2ee-user-1'));
    expect(wrappers).toHaveLength(1);
    expect(wrappers[0].id).toBe(first.wrappingId);
  });

  it('rejects invalid payloads', async () => {
    const p = validPayload();
    const res = await req('/api/e2ee/key-ring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...p,
        mek: { ...p.mek, kdfSalt: bytesBase64(8) },
      }),
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

  it('changes the active password wrapper without changing the key ring', async () => {
    const payload = validPayload();
    await req('/api/e2ee/key-ring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const changePayload = validChangePayload(payload.wrappingId);
    const res = await req('/api/e2ee/key-ring/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changePayload),
    });

    expect(res.status).toBe(204);

    const get = await req('/api/e2ee/key-ring');
    expect(get.status).toBe(200);
    const profile: SerializedKeyRingProfile = await get.json();
    expect(profile.keyRing).toMatchObject({
      id: payload.keyRingId,
      activeDekId: payload.activeDekId,
      revision: 1,
      ciphertext: payload.keyRing.ciphertext,
    });
    expect(profile.wrappers).toEqual([
      expect.objectContaining({ id: changePayload.wrappingId }),
    ]);

    const db = getDb(workerTestEnv.DB);
    const wrappers = await db
      .select()
      .from(keyRingWrapping)
      .where(eq(keyRingWrapping.userId, 'e2ee-user-1'));
    expect(wrappers).toHaveLength(2);
    expect(wrappers.filter((w) => w.status === 'active')).toHaveLength(1);
    expect(wrappers.filter((w) => w.status === 'revoked')).toHaveLength(1);

    const rows = await db
      .select()
      .from(keyRing)
      .where(eq(keyRing.userId, 'e2ee-user-1'));
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(payload.keyRingId);
    expect(rows[0].revision).toBe(1);
  });

  it('updates the encrypted key ring when revision matches', async () => {
    const payload = validPayload();
    await req('/api/e2ee/key-ring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const updatePayload = validUpdatePayload(1);
    const res = await req('/api/e2ee/key-ring', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });

    expect(res.status).toBe(200);
    const profile: SerializedKeyRingProfile = await res.json();
    expect(profile.keyRing).toMatchObject({
      id: payload.keyRingId,
      activeDekId: updatePayload.activeDekId,
      revision: 2,
      encryptionAlgorithm: updatePayload.encryptionAlgorithm,
      encryptionParams: updatePayload.encryptionParams,
      ciphertext: updatePayload.ciphertext,
    });
    expect(profile.wrappers).toEqual([
      expect.objectContaining({ id: payload.wrappingId }),
    ]);
  });

  it('rejects stale key ring revision without changing ciphertext', async () => {
    const payload = validPayload();
    await req('/api/e2ee/key-ring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const firstUpdate = validUpdatePayload(1);
    await req('/api/e2ee/key-ring', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firstUpdate),
    });

    const staleUpdate = {
      ...validUpdatePayload(1),
      activeDekId: '77777777-7777-4777-8777-777777777777',
      ciphertext: bytesBase64(72),
    };
    const res = await req('/api/e2ee/key-ring', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staleUpdate),
    });

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ code: 'key_ring_revision_conflict' });

    const get = await req('/api/e2ee/key-ring');
    const profile: SerializedKeyRingProfile = await get.json();
    expect(profile.keyRing).toMatchObject({
      activeDekId: firstUpdate.activeDekId,
      revision: 2,
      ciphertext: firstUpdate.ciphertext,
    });
  });

  it('rejects invalid key ring update payloads', async () => {
    const payload = validPayload();
    await req('/api/e2ee/key-ring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await req('/api/e2ee/key-ring', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validUpdatePayload(1),
        encryptionParams: { iv: bytesBase64(8), tagBits: 128 },
      }),
    });

    expect(res.status).toBe(400);
    const get = await req('/api/e2ee/key-ring');
    const profile: SerializedKeyRingProfile = await get.json();
    expect(profile.keyRing.revision).toBe(1);
    expect(profile.keyRing.ciphertext).toBe(payload.keyRing.ciphertext);
  });

  it('rejects stale password wrapper changes without replacing the active wrapper', async () => {
    const payload = validPayload();
    await req('/api/e2ee/key-ring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const staleId = '55555555-5555-4555-8555-555555555555';
    const res = await req('/api/e2ee/key-ring/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validChangePayload(staleId)),
    });

    expect(res.status).toBe(409);

    const db = getDb(workerTestEnv.DB);
    const [active] = await db
      .select()
      .from(keyRingWrapping)
      .where(
        and(
          eq(keyRingWrapping.userId, 'e2ee-user-1'),
          eq(keyRingWrapping.status, 'active'),
        ),
      );
    expect(active.id).toBe(payload.wrappingId);
  });

  it('rejects invalid password change payloads', async () => {
    const payload = validPayload();
    await req('/api/e2ee/key-ring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await req('/api/e2ee/key-ring/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validChangePayload(payload.wrappingId),
        wrappingParams: { iv: bytesBase64(8), tagBits: 128 },
      }),
    });

    expect(res.status).toBe(400);
  });

  it('rejects setup when key ring ciphertext exceeds 64 KiB', async () => {
    const oversized = new Uint8Array(64 * 1024 + 1).fill(1).toBase64();
    const p = validPayload();
    const res = await req('/api/e2ee/key-ring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...p,
        keyRing: { ...p.keyRing, ciphertext: oversized },
      }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects key ring update when key ring ciphertext exceeds 64 KiB', async () => {
    const payload = validPayload();
    await req('/api/e2ee/key-ring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const oversized = new Uint8Array(64 * 1024 + 1).fill(1).toBase64();
    const res = await req('/api/e2ee/key-ring', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validUpdatePayload(1),
        ciphertext: oversized,
      }),
    });
    expect(res.status).toBe(400);
  });
});
