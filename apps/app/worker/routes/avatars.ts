import { eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { requireSession } from '../auth';
import {
  AVATAR_CACHE_CONTROL,
  avatarKeyToPublicPath,
  isValidAvatarId,
  isValidUserUploadSize,
  isWebP,
  publicPathToAvatarKey,
  storeUserUploadedAvatar,
  updateUserAvatar,
} from '../avatar-storage';
import { getDb } from '../db';
import { user } from '../db/schema/auth';

export const avatarsRouter = new Hono<{ Bindings: Env }>();

avatarsRouter.get('/avatars/:id', async (c) => {
  const id = c.req.param('id');
  if (!isValidAvatarId(id)) {
    return c.body(null, 404);
  }

  const session = await requireSession(c);
  if (session instanceof Response) return session;

  const db = getDb(c.env.DB);
  const [currentUser] = await db
    .select({ image: user.image })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (currentUser?.image !== avatarKeyToPublicPath(id)) {
    return c.body(null, 404);
  }

  const object = await c.env.AVATARS.get(id);
  if (!object) {
    return c.body(null, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', AVATAR_CACHE_CONTROL);
  headers.set('X-Content-Type-Options', 'nosniff');

  return new Response(object.body, { headers });
});

avatarsRouter.put('/api/profile/avatar', async (c) => {
  const session = await requireSession(c);
  if (session instanceof Response) return session;

  if (c.req.header('Content-Type') !== 'image/webp') {
    return c.json({ code: 'unsupported_content_type' }, 415);
  }

  const contentLength = parseInt(c.req.header('Content-Length') ?? '', 10);
  if (Number.isFinite(contentLength) && !isValidUserUploadSize(contentLength)) {
    return c.json({ code: 'payload_too_large' }, 413);
  }

  const bytes = new Uint8Array(await c.req.arrayBuffer());
  if (!isValidUserUploadSize(bytes.byteLength)) {
    return c.json({ code: 'payload_too_large' }, 413);
  }
  if (!isWebP(bytes)) {
    return c.json({ code: 'invalid_webp' }, 400);
  }

  const db = getDb(c.env.DB);
  const [currentUser] = await db
    .select({ image: user.image })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const oldKey = publicPathToAvatarKey(currentUser?.image);
  const stored = await storeUserUploadedAvatar(c.env.AVATARS, bytes);

  try {
    await updateUserAvatar(db, session.user.id, stored.publicPath);
  } catch (error) {
    c.executionCtx.waitUntil(c.env.AVATARS.delete(stored.key));
    throw error;
  }

  if (oldKey) {
    c.executionCtx.waitUntil(c.env.AVATARS.delete(oldKey));
  }

  return c.json({ image: stored.publicPath, imageStatus: 'ready' });
});

avatarsRouter.delete('/api/profile/avatar', async (c) => {
  const session = await requireSession(c);
  if (session instanceof Response) return session;

  const db = getDb(c.env.DB);
  const [currentUser] = await db
    .select({ image: user.image })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  await updateUserAvatar(db, session.user.id, null);

  const oldKey = publicPathToAvatarKey(currentUser?.image);
  if (oldKey) {
    c.executionCtx.waitUntil(c.env.AVATARS.delete(oldKey));
  }

  return c.json({ image: null, imageStatus: 'ready' });
});
