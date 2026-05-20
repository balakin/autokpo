import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearAuthData, workerTestEnv } from '../../tests/worker/auth-helpers';
import {
  flushWaitUntil,
  makeAuthHeaders,
  mergeHeaders,
  mockCtx,
  type SessionState,
} from '../../tests/worker/request-helpers';
import {
  AVATAR_PUBLIC_PREFIX,
  IMMUTABLE_AVATAR_CACHE_CONTROL,
  avatarKeyToPublicPath,
  createAvatarKey,
  importPendingAvatar,
  isValidAvatarId,
  isValidUserUploadSize,
  isWebP,
  publicPathToAvatarKey,
} from '../avatar-storage';
import { getDb } from '../db';
import { user } from '../db/schema/auth';
import app from '../main';
import { avatarsRouter } from '../routes/avatars';

const sessionState: SessionState = { userId: 'avatar-user-1', headers: null };
const authHeaders = makeAuthHeaders(sessionState);

function makeWebPBytes() {
  return new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    0x00,
  ]);
}

async function req(url: string, init?: RequestInit) {
  return app.request(
    url,
    {
      ...init,
      headers: mergeHeaders(init?.headers, await authHeaders()),
    },
    workerTestEnv,
    mockCtx,
  );
}

beforeEach(async () => {
  sessionState.userId = 'avatar-user-1';
  sessionState.headers = null;
  (mockCtx.waitUntil as unknown as { mockClear(): void }).mockClear();
  await flushWaitUntil();
  await clearAuthData();
  await workerTestEnv.DB.exec('DELETE FROM updates');
  const listed = await workerTestEnv.AVATARS.list();
  await Promise.all(
    listed.objects.map((o) => workerTestEnv.AVATARS.delete(o.key)),
  );
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('avatar storage helpers', () => {
  it('validates avatar ids and public paths', () => {
    const key = createAvatarKey();

    expect(isValidAvatarId(key)).toBe(true);
    expect(publicPathToAvatarKey(`${AVATAR_PUBLIC_PREFIX}${key}`)).toBe(key);
    expect(avatarKeyToPublicPath(key)).toBe(`${AVATAR_PUBLIC_PREFIX}${key}`);
    expect(publicPathToAvatarKey('/avatars/not-a-uuid')).toBeNull();
  });

  it('validates webp magic and upload size limits', () => {
    expect(isWebP(makeWebPBytes())).toBe(true);
    expect(isWebP(new Uint8Array([1, 2, 3]))).toBe(false);
    expect(isValidUserUploadSize(1)).toBe(true);
    expect(isValidUserUploadSize(256 * 1024)).toBe(true);
    expect(isValidUserUploadSize(256 * 1024 + 1)).toBe(false);
  });
});

describe('GET /avatars/:id', () => {
  it('serves avatar bytes with immutable headers', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const bytes = new Uint8Array([1, 2, 3]);
    await workerTestEnv.AVATARS.put(id, bytes, {
      httpMetadata: {
        contentType: 'image/webp',
        cacheControl: IMMUTABLE_AVATAR_CACHE_CONTROL,
      },
    });

    const res = await avatarsRouter.fetch(
      new Request(`http://localhost/avatars/${id}`),
      workerTestEnv,
      mockCtx,
    );

    expect(res.status).toBe(200);
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(bytes);
    expect(res.headers.get('Content-Type')).toBe('image/webp');
    expect(res.headers.get('Cache-Control')).toBe(
      IMMUTABLE_AVATAR_CACHE_CONTROL,
    );
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('returns 404 for invalid ids and missing objects', async () => {
    const invalid = await avatarsRouter.fetch(
      new Request('http://localhost/avatars/not-a-uuid'),
      workerTestEnv,
      mockCtx,
    );
    expect(invalid.status).toBe(404);

    const missing = await avatarsRouter.fetch(
      new Request(
        'http://localhost/avatars/11111111-1111-4111-8111-111111111111',
      ),
      workerTestEnv,
      mockCtx,
    );
    expect(missing.status).toBe(404);
  });
});

describe('PUT /api/profile/avatar', () => {
  it('rejects invalid content-type, size, and webp magic', async () => {
    await expect(
      req('/api/profile/avatar', { method: 'PUT', body: makeWebPBytes() }),
    ).resolves.toMatchObject({ status: 415 });

    const tooLarge = new Uint8Array(256 * 1024 + 1);
    const largeRes = await req('/api/profile/avatar', {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/webp',
        'Content-Length': String(tooLarge.byteLength),
      },
      body: tooLarge,
    });
    expect(largeRes.status).toBe(413);

    const invalidWebP = await req('/api/profile/avatar', {
      method: 'PUT',
      headers: { 'Content-Type': 'image/webp' },
      body: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    });
    expect(invalidWebP.status).toBe(400);
  });

  it('stores avatar, updates db, and schedules old avatar cleanup', async () => {
    const oldKey = '11111111-1111-4111-8111-111111111111';
    const db = getDb(workerTestEnv.DB);

    await authHeaders();
    await db
      .update(user)
      .set({ image: avatarKeyToPublicPath(oldKey) })
      .where(eq(user.id, 'avatar-user-1'));
    await workerTestEnv.AVATARS.put(oldKey, new Uint8Array([0, 0, 0]));

    const bytes = makeWebPBytes();
    const res = await req('/api/profile/avatar', {
      method: 'PUT',
      headers: { 'Content-Type': 'image/webp' },
      body: bytes,
    });

    expect(res.status).toBe(200);
    const body = await res.json<{ image: string; imageStatus: string }>();
    expect(body.image).toMatch(/^\/avatars\//);
    expect(body.imageStatus).toBe('ready');

    const newKey = publicPathToAvatarKey(body.image)!;
    const stored = await workerTestEnv.AVATARS.get(newKey);
    expect(stored).not.toBeNull();
    expect(new Uint8Array(await stored!.arrayBuffer())).toEqual(bytes);

    await flushWaitUntil();
    expect(await workerTestEnv.AVATARS.get(oldKey)).toBeNull();
  });
});

describe('DELETE /api/auth/delete-user', () => {
  it('deletes avatar from R2 when account is deleted', async () => {
    const db = getDb(workerTestEnv.DB);

    await authHeaders();
    const avatarKey = '22222222-2222-4222-8222-222222222222';
    await workerTestEnv.AVATARS.put(avatarKey, new Uint8Array([1, 2, 3]));
    await db
      .update(user)
      .set({ image: avatarKeyToPublicPath(avatarKey) })
      .where(eq(user.id, 'avatar-user-1'));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 200 })),
    );

    const res = await req('/api/auth/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(200);

    await flushWaitUntil();
    expect(await workerTestEnv.AVATARS.get(avatarKey)).toBeNull();
  });

  it('succeeds without error when account has no avatar', async () => {
    await authHeaders();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 200 })),
    );

    const res = await req('/api/auth/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(200);
  });
});

describe('importPendingAvatar', () => {
  it('imports supported provider avatars and rejects unsupported content', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(new Uint8Array([1, 2, 3, 4]), {
          status: 200,
          headers: {
            'Content-Type': 'image/png; charset=utf-8',
            'Content-Length': '4',
          },
        }),
      ),
    );

    await importPendingAvatar(
      workerTestEnv,
      'import-user',
      'https://example.com/avatar.png',
    );
    expect((await workerTestEnv.AVATARS.list()).objects).toHaveLength(1);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('nope', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );

    await importPendingAvatar(
      workerTestEnv,
      'import-user-2',
      'https://example.com/avatar.gif',
    );
    expect((await workerTestEnv.AVATARS.list()).objects).toHaveLength(1);
  });

  it('rejects provider avatars that exceed max size', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(new Uint8Array(1024 * 1024 + 1), {
          status: 200,
          headers: { 'Content-Type': 'image/jpeg' },
        }),
      ),
    );

    await importPendingAvatar(
      workerTestEnv,
      'import-user-3',
      'https://example.com/avatar.jpg',
    );
    expect((await workerTestEnv.AVATARS.list()).objects).toHaveLength(0);
  });
});
