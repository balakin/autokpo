import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LeaderProvider } from '../leader-provider';
import { useLeader } from '../use-leader';

function Harness() {
  const leader = useLeader();
  return (
    <>
      <span data-testid="isLeader">{String(leader.isLeader)}</span>
    </>
  );
}

describe('LeaderProvider', () => {
  it('starts as follower before lock acquisition', () => {
    vi.stubGlobal(
      'navigator',
      Object.create(navigator, {
        locks: {
          value: {
            request: vi.fn(() => new Promise<void>(() => {})),
          },
          configurable: true,
        },
      }),
    );

    render(
      <LeaderProvider>
        <Harness />
      </LeaderProvider>,
    );

    expect(screen.getByTestId('isLeader')).toHaveTextContent('false');
  });

  it('becomes leader when lock callback runs', async () => {
    vi.stubGlobal(
      'navigator',
      Object.create(navigator, {
        locks: {
          value: {
            request: vi.fn(
              (
                _name: string,
                _opts: { signal?: AbortSignal },
                callback: () => Promise<void>,
              ) => {
                void callback();
                return Promise.resolve();
              },
            ),
          },
          configurable: true,
        },
      }),
    );

    render(
      <LeaderProvider>
        <Harness />
      </LeaderProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLeader')).toHaveTextContent('true');
    });
  });

  it('aborts lock request on unmount', () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'navigator',
      Object.create(navigator, {
        locks: {
          value: {
            request: vi.fn(
              (
                _name: string,
                opts: { signal?: AbortSignal },
                callback: () => Promise<void>,
              ) => {
                void callback;
                signal = opts.signal;
                return new Promise<void>(() => {});
              },
            ),
          },
          configurable: true,
        },
      }),
    );

    const { unmount } = render(
      <LeaderProvider>
        <Harness />
      </LeaderProvider>,
    );

    expect(signal).toBeDefined();
    expect(signal!.aborted).toBe(false);
    unmount();
    expect(signal!.aborted).toBe(true);
  });
});
