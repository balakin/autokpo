import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Listener = (event: MessageEvent<unknown>) => void;

class FakeWorker {
  static instances: FakeWorker[] = [];

  listeners = new Map<string, Set<Listener>>();
  postedMessage: unknown;
  terminated = false;

  constructor() {
    FakeWorker.instances.push(this);
  }

  addEventListener(type: string, listener: Listener) {
    const listeners = this.listeners.get(type) ?? new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener);
  }

  postMessage(message: unknown) {
    this.postedMessage = message;
  }

  terminate() {
    this.terminated = true;
  }

  emitMessage(data: unknown) {
    for (const listener of this.listeners.get('message') ?? []) {
      listener({ data } as MessageEvent<unknown>);
    }
  }
}

const params = {
  memorySize: 65536,
  iterations: 3,
  parallelism: 1,
  hashLength: 32,
};

describe('deriveKek', () => {
  beforeEach(() => {
    vi.resetModules();
    FakeWorker.instances = [];
    vi.stubGlobal('Worker', FakeWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('resolves with KEK bytes returned by the worker', async () => {
    const { deriveKek } = await import('../kdf');
    const promise = deriveKek('password', new Uint8Array(16), params);
    const worker = FakeWorker.instances[0];
    expect(worker?.postedMessage).toMatchObject({
      password: 'password',
      params,
    });

    const request = worker?.postedMessage as { id: string };
    const kek = new Uint8Array(32).fill(9);
    worker?.emitMessage({ id: request.id, ok: true, kek });

    await expect(promise).resolves.toEqual(kek);
  });

  it('terminates and rejects when the worker does not respond', async () => {
    vi.useFakeTimers();
    const { deriveKek } = await import('../kdf');
    const promise = deriveKek('password', new Uint8Array(16), params);
    const rejection = expect(promise).rejects.toThrow('argon2id_timeout');
    const worker = FakeWorker.instances[0];

    await vi.advanceTimersByTimeAsync(60_000);

    expect(worker?.terminated).toBe(true);
    await rejection;
  });
});
