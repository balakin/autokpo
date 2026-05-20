import type { ExecutionContext } from 'hono';
import { vi } from 'vitest';

import { TEST_APP_URL, getAuthHeaders } from './auth-helpers';

export type SessionState = { userId: string | null; headers: Headers | null };

const pendingWaitUntil: Array<Promise<unknown>> = [];

export const mockCtx = {
  waitUntil: vi.fn((p: Promise<unknown>) => {
    pendingWaitUntil.push(p);
  }),
  passThroughOnException: vi.fn(),
} as unknown as ExecutionContext;

export async function flushWaitUntil(): Promise<void> {
  const pending = pendingWaitUntil.splice(0);
  await Promise.allSettled(pending);
}

export function mergeHeaders(
  ...values: Array<HeadersInit | undefined>
): Headers {
  const headers = new Headers();
  for (const value of values) {
    if (!value) continue;
    new Headers(value).forEach((headerValue, key) => {
      headers.set(key, headerValue);
    });
  }
  return headers;
}

export function makeAuthHeaders(sessionState: SessionState) {
  return async (): Promise<HeadersInit | undefined> => {
    if (!sessionState.userId) {
      return undefined;
    }
    if (sessionState.headers) {
      return sessionState.headers;
    }
    const headers = await getAuthHeaders(sessionState.userId);
    headers.set('Origin', TEST_APP_URL);
    sessionState.headers = headers;
    return sessionState.headers;
  };
}
