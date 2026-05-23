import { argon2id } from 'hash-wasm';

import type { KdfParamsV1 } from './key-ring-record';

type KdfWorkerRequest = {
  id: string;
  password: string;
  salt: Uint8Array;
  params: KdfParamsV1;
};

type KdfWorkerResponse =
  | { id: string; ok: true; kek: Uint8Array }
  | { id: string; ok: false; error: string };

self.addEventListener('message', (event: MessageEvent<KdfWorkerRequest>) => {
  const { id, password, salt, params } = event.data;
  void derive(id, password, salt, params);
});

async function derive(
  id: string,
  password: string,
  salt: Uint8Array,
  params: KdfParamsV1,
): Promise<void> {
  try {
    const kek = await argon2id({
      password,
      salt,
      iterations: params.iterations,
      parallelism: params.parallelism,
      memorySize: params.memorySize,
      hashLength: params.hashLength,
      outputType: 'binary',
    });
    postMessage({ id, ok: true, kek } satisfies KdfWorkerResponse);
  } catch (error) {
    postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : 'argon2id_failed',
    } satisfies KdfWorkerResponse);
  }
}
