import { eq } from 'drizzle-orm';

import { getDb } from './db';
import { user } from './db/schema/auth';

export const AVATAR_PUBLIC_PREFIX = '/avatars/';
export const AVATAR_CACHE_CONTROL = 'no-store';

const USER_UPLOAD_MAX_BYTES = 256 * 1024;
const PROVIDER_IMPORT_MAX_BYTES = 1 * 1024 * 1024;
const ALLOWED_PROVIDER_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function createAvatarKey(): string {
  return crypto.randomUUID();
}

export function avatarKeyToPublicPath(key: string): string {
  return `${AVATAR_PUBLIC_PREFIX}${key}`;
}

export function publicPathToAvatarKey(
  path: string | null | undefined,
): string | null {
  if (!path?.startsWith(AVATAR_PUBLIC_PREFIX)) return null;
  const id = path.slice(AVATAR_PUBLIC_PREFIX.length);
  if (!isValidAvatarId(id)) return null;
  return id;
}

export function isValidAvatarId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );
}

export function isWebP(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

export function isValidUserUploadSize(size: number): boolean {
  return size > 0 && size <= USER_UPLOAD_MAX_BYTES;
}

export async function storeUserUploadedAvatar(
  bucket: R2Bucket,
  bytes: Uint8Array,
): Promise<{ key: string; publicPath: string }> {
  const key = createAvatarKey();
  await bucket.put(key, bytes, {
    httpMetadata: {
      contentType: 'image/webp',
      cacheControl: AVATAR_CACHE_CONTROL,
    },
  });
  return { key, publicPath: avatarKeyToPublicPath(key) };
}

export async function updateUserAvatar(
  db: ReturnType<typeof getDb>,
  userId: string,
  image: string | null,
): Promise<void> {
  await db
    .update(user)
    .set({ image, imageStatus: 'ready', pendingAvatarUrl: null })
    .where(eq(user.id, userId));
}

export async function importPendingAvatar(
  env: Env,
  userId: string,
  pendingAvatarUrl: string,
): Promise<void> {
  try {
    const response = await fetch(pendingAvatarUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) throw new Error('fetch failed');

    const contentType = normalizeContentType(
      response.headers.get('Content-Type'),
    );
    if (!contentType || !ALLOWED_PROVIDER_IMAGE_TYPES.has(contentType)) {
      throw new Error('unsupported content type');
    }

    const contentLength = parseInt(
      response.headers.get('Content-Length') ?? '',
      10,
    );
    if (
      Number.isFinite(contentLength) &&
      contentLength > PROVIDER_IMPORT_MAX_BYTES
    ) {
      throw new Error('content too large');
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (
      bytes.byteLength === 0 ||
      bytes.byteLength > PROVIDER_IMPORT_MAX_BYTES
    ) {
      throw new Error('content too large');
    }

    const key = createAvatarKey();
    await env.AVATARS.put(key, bytes, {
      httpMetadata: {
        contentType,
        cacheControl: AVATAR_CACHE_CONTROL,
      },
    });

    await updateUserAvatar(getDb(env.DB), userId, avatarKeyToPublicPath(key));
  } catch (error) {
    console.error('Failed to import pending avatar for user', userId, error);
    await clearPendingAvatar(env, userId);
  }
}

async function clearPendingAvatar(env: Env, userId: string): Promise<void> {
  await updateUserAvatar(getDb(env.DB), userId, null);
}

function normalizeContentType(value: string | null): string | null {
  return value?.split(';')[0]?.trim().toLowerCase() || null;
}
