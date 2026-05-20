import { useEffect, useState, type ReactNode } from 'react';

import { createLogger } from '../utils/create-logger';

import { LeaderContext } from './leader-context';

const LOCK_NAME = 'autokpo-leader';
const log = createLogger('leader');

export function LeaderProvider({ children }: { children: ReactNode }) {
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let releaseLock: (() => void) | null = null;

    void navigator.locks
      .request(LOCK_NAME, { signal: controller.signal }, async () => {
        log('became leader');
        setIsLeader(true);
        await new Promise<void>((resolve) => {
          releaseLock = resolve;
        });
      })
      .catch(() => {
        setIsLeader(false);
      });

    return () => {
      // Teardown is imperative (lock release + abort); no state cleanup needed.
      releaseLock?.();
      controller.abort();
    };
  }, []);

  return <LeaderContext value={{ isLeader }}>{children}</LeaderContext>;
}
