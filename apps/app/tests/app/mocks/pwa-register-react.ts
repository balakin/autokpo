import { useState } from 'react';

let initialNeedRefresh = false;
let updateServiceWorker = (): Promise<void> => Promise.resolve();

export function useRegisterSW(options?: {
  immediate?: boolean;
  onRegisteredSW?: (
    url: string,
    reg: ServiceWorkerRegistration | undefined,
  ) => void;
  onRegisterError?: (error: unknown) => void;
}): {
  needRefresh: [boolean, (value: boolean) => void];
  offlineReady: [boolean, (value: boolean) => void];
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
} {
  void options;
  const [needRefresh, setNeedRefresh] = useState(initialNeedRefresh);

  return {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [false, () => {}],
    updateServiceWorker,
  };
}

export function setPwaNeedRefresh(value: boolean): void {
  initialNeedRefresh = value;
}

export function setPwaUpdateServiceWorker(
  update: (reloadPage?: boolean) => Promise<void>,
): void {
  updateServiceWorker = update;
}

export function resetPwaRegisterMock(): void {
  initialNeedRefresh = false;
  updateServiceWorker = () => Promise.resolve();
}
