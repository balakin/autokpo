import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearProtectedCaches } from '../clear-protected-caches';
import {
  AUTH_SESSION_CACHE_NAME,
  E2EE_KEY_RING_CACHE_NAME,
} from '../sw-cache-names';

describe('clearProtectedCaches', () => {
  let deleteCache: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    deleteCache = vi.fn().mockResolvedValue(true);

    vi.stubGlobal('caches', {
      delete: deleteCache,
    });
  });

  it('deletes the auth-session and e2ee-key-ring caches by name', async () => {
    await clearProtectedCaches();

    expect(deleteCache).toHaveBeenCalledWith(AUTH_SESSION_CACHE_NAME);
    expect(deleteCache).toHaveBeenCalledWith(E2EE_KEY_RING_CACHE_NAME);
    expect(deleteCache).toHaveBeenCalledTimes(2);
  });

  it('does nothing when caches API is unavailable', async () => {
    vi.stubGlobal('caches', undefined);
    await expect(clearProtectedCaches()).resolves.toBeUndefined();
  });
});
