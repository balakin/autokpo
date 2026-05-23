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

let worker: Worker | null = null;

const KDF_TIMEOUT_MS = 60_000;

export function deriveKek(
  password: string,
  salt: Uint8Array,
  params: KdfParamsV1,
): Promise<Uint8Array> {
  const id = crypto.randomUUID();
  const kdfWorker = getKdfWorker();

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      kdfWorker.terminate();
      if (worker === kdfWorker) worker = null;
      reject(new Error('argon2id_timeout'));
    }, KDF_TIMEOUT_MS);

    function cleanup() {
      window.clearTimeout(timeoutId);
      kdfWorker.removeEventListener('message', onMessage);
      kdfWorker.removeEventListener('error', onError);
    }

    function onMessage(event: MessageEvent<KdfWorkerResponse>) {
      if (event.data.id !== id) return;
      cleanup();
      if (event.data.ok) {
        resolve(event.data.kek);
      } else {
        reject(new Error(event.data.error));
      }
    }

    function onError(event: ErrorEvent) {
      cleanup();
      reject(
        event.error instanceof Error ? event.error : new Error(event.message),
      );
    }

    kdfWorker.addEventListener('message', onMessage);
    kdfWorker.addEventListener('error', onError);
    kdfWorker.postMessage({
      id,
      password,
      salt,
      params,
    } satisfies KdfWorkerRequest);
  });
}

function getKdfWorker(): Worker {
  worker ??= new Worker(new URL('./kdf-worker.ts', import.meta.url), {
    type: 'module',
  });
  return worker;
}
